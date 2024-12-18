import { birdeyeService } from './birdeyeService';
import { config } from '../config/config';
import { Server } from 'socket.io';
import { AlertService } from './alertService';
import { PrismaClient } from '@prisma/client';

export class PriceMonitorService {
    private io: Server;
    private intervalId: NodeJS.Timeout | null = null;
    private priceUpdateInterval: NodeJS.Timeout | null = null;
    private alertService: AlertService;
    private lastPrices: Map<string, number> = new Map();
    private prisma: PrismaClient;

    constructor(io: Server, alertService: AlertService, prisma: PrismaClient) {
        this.io = io;
        this.alertService = alertService;
        this.prisma = prisma;
    }

    async updatePriceHistory(): Promise<void> {
        try {
            const now = Math.floor(Date.now() / 1000);
            const timeFrom = now - 60; // Last minute

            for (const [symbol, address] of Object.entries(config.tokens)) {
                try {
                    const prices = await birdeyeService.getHistoricalPrices(
                        address,
                        timeFrom,
                        now,
                        '1m'
                    );

                    if (prices.length > 0) {
                        await this.prisma.priceHistory.create({
                            data: {
                                token: symbol,
                                price: prices[prices.length - 1].value,
                                timestamp: new Date(prices[prices.length - 1].unixTime * 1000)
                            }
                        });
                    }
                } catch (error) {
                    console.error(`Error updating price history for ${symbol}:`, error);
                    continue;
                }
            }
        } catch (error) {
            console.error('Error in updatePriceHistory:', error);
            throw error;
        }
    }

    async initializeHistoricalData(): Promise<void> {
        try {
            const now = Math.floor(Date.now() / 1000);
            const oneDayAgo = now - (24 * 60 * 60);

            for (const [symbol, address] of Object.entries(config.tokens)) {
                try {
                    const prices = await birdeyeService.getHistoricalPrices(
                        address,
                        oneDayAgo,
                        now,
                        '1m'
                    );

                    if (prices.length > 0) {
                        // Process prices in batches to avoid duplicates
                        for (const p of prices) {
                            const timestamp = new Date(p.unixTime * 1000);
                            await this.prisma.priceHistory.upsert({
                                where: {
                                    token_timestamp: {
                                        token: symbol,
                                        timestamp: timestamp
                                    }
                                },
                                create: {
                                    token: symbol,
                                    price: p.value,
                                    timestamp: timestamp
                                },
                                update: {
                                    price: p.value
                                }
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error initializing historical data for ${symbol}:`, error);
                    continue;
                }
            }
            console.log('Historical data initialized');
        } catch (error) {
            console.error('Error in initializeHistoricalData:', error);
            throw error;
        }
    }

    async checkPriceMovement(symbol: string, address: string): Promise<void> {
        try {
            const { price } = await birdeyeService.getTokenPrice(address);
            const lastPrice = this.lastPrices.get(symbol);

            if (lastPrice) {
                const priceChange = ((price - lastPrice) / lastPrice) * 100;
                const timestamp = new Date().toLocaleTimeString();
                
                // Log price update with timestamp
                console.log(`[${timestamp}] 💰 ${symbol}: $${price.toFixed(6)} (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%)`);

                this.io.emit('priceUpdate', {
                    symbol,
                    price,
                    timestamp: new Date(),
                    priceChange
                });

                await this.alertService.checkAlerts(symbol, price);
            }

            this.lastPrices.set(symbol, price);

        } catch (error) {
            console.error(`Error checking price movement for ${symbol}:`, error);
        }
    }

    async monitorPrices(): Promise<void> {
        try {
            for (const [symbol, address] of Object.entries(config.tokens)) {
                await this.checkPriceMovement(symbol, address);
            }
        } catch (error) {
            console.error('Error in price monitoring cycle:', error);
        }
    }

    startMonitoring(): void {
        // Initialize historical data
        this.initializeHistoricalData();

        // Set up price history updates every minute
        this.priceUpdateInterval = setInterval(() => {
            this.updatePriceHistory();
        }, 60 * 1000); // Every minute

        // Regular price monitoring
        this.monitorPrices();
        this.intervalId = setInterval(() => {
            this.monitorPrices();
        }, config.updateInterval);

        console.log('Price monitoring and history updates started');
    }

    stopMonitoring(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
            this.priceUpdateInterval = null;
        }
        console.log('Price monitoring stopped');
    }
} 