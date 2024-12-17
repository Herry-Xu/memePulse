import { birdeyeService } from './birdeyeService';
import { config } from '../config/config';
import { prisma } from '../index';
import { TokenPrice } from '../types';
import { Server } from 'socket.io';
import { AlertService } from './alertService';

export class PriceMonitorService {
    private io: Server;
    private intervalId: NodeJS.Timeout | null = null;
    private alertService: AlertService;

    constructor(io: Server, alertService: AlertService) {
        this.io = io;
        this.alertService = alertService;
    }

    async fetchAndStorePrice(symbol: string, address: string): Promise<TokenPrice> {
        try {
            const price = await birdeyeService.getTokenPrice(address);
            
            // Store price in database
            await prisma.priceHistory.create({
                data: {
                    token: symbol,
                    price: price,
                    timestamp: new Date()
                }
            });

            const tokenPrice: TokenPrice = {
                symbol,
                price,
                timestamp: new Date()
            };

            // Emit price update through WebSocket
            this.io.emit('priceUpdate', tokenPrice);

            // Check alerts
            await this.alertService.checkAlerts(symbol, price);

            return tokenPrice;
        } catch (error) {
            console.error(`Error fetching price for ${symbol}:`, error);
            throw error;
        }
    }

    async fetchAllPrices(): Promise<TokenPrice[]> {
        const prices: TokenPrice[] = [];
        
        for (const [symbol, address] of Object.entries(config.tokens)) {
            try {
                const tokenPrice = await this.fetchAndStorePrice(symbol, address);
                prices.push(tokenPrice);
            } catch (error) {
                console.error(`Error fetching price for ${symbol}:`, error);
            }
        }

        return prices;
    }

    startMonitoring(): void {
        // Fetch prices immediately
        this.fetchAllPrices();

        // Then set up interval
        this.intervalId = setInterval(() => {
            this.fetchAllPrices();
        }, config.updateInterval);
    }

    stopMonitoring(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    async getPriceHistory(symbol: string, timeframe: number): Promise<TokenPrice[]> {
        const startTime = new Date(Date.now() - timeframe * 60 * 1000); // timeframe in minutes

        const prices = await prisma.priceHistory.findMany({
            where: {
                token: symbol,
                timestamp: {
                    gte: startTime
                }
            },
            orderBy: {
                timestamp: 'asc'
            }
        });

        return prices.map(p => ({
            symbol: p.token,
            price: p.price,
            timestamp: p.timestamp
        }));
    }

    async calculatePriceChange(symbol: string, timeframeMinutes: number): Promise<number> {
        const prices = await this.getPriceHistory(symbol, timeframeMinutes);
        
        if (prices.length < 2) return 0;

        const oldestPrice = prices[0].price;
        const latestPrice = prices[prices.length - 1].price;

        return ((latestPrice - oldestPrice) / oldestPrice) * 100;
    }
} 