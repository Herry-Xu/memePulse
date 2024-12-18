import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { PriceAlert } from '../types';

export class AlertService {
    private prisma: PrismaClient;
    private io: Server;

    constructor(prisma: PrismaClient, io: Server) {
        this.prisma = prisma;
        this.io = io;
    }

    async createAlert(alert: PriceAlert) {
        return await this.prisma.alert.create({
            data: {
                symbol: alert.symbol,
                thresholdPercent: alert.thresholdPercent,
                timeframeMinutes: alert.timeframeMinutes,
                active: true
            }
        });
    }

    async checkAlerts(symbol: string, currentPrice: number) {
        try {
            const activeAlerts = await this.prisma.alert.findMany({
                where: { symbol, active: true }
            });

            if (activeAlerts.length === 0) return;

            for (const alert of activeAlerts) {
                // Check if alert has expired
                const now = new Date();
                const alertExpiration = new Date(alert.createdAt.getTime() + (alert.timeframeMinutes * 60 * 1000));
                
                if (now > alertExpiration) {
                    await this.prisma.alert.update({
                        where: { id: alert.id },
                        data: { 
                            active: false,
                            status: 'expired',
                            updatedAt: now
                        }
                    });
                    continue;
                }

                // Get historical prices from database
                const timeFrom = new Date(now.getTime() - (alert.timeframeMinutes * 60 * 1000));
                const prices = await this.prisma.priceHistory.findMany({
                    where: {
                        token: symbol,
                        timestamp: {
                            gte: timeFrom
                        }
                    },
                    orderBy: {
                        timestamp: 'asc'
                    },
                    take: 1
                });

                if (prices.length === 0) continue;

                const oldestPrice = prices[0];
                const priceChange = ((currentPrice - oldestPrice.price) / oldestPrice.price) * 100;

                if (Math.abs(priceChange) >= alert.thresholdPercent) {
                    const timestamp = new Date().toLocaleString(); // Date and time
                    
                    // Log alert trigger with timestamp
                    console.log(`[${timestamp}] 🚨 ALERT: ${symbol} price ${priceChange >= 0 ? 'increased' : 'decreased'} by ${Math.abs(priceChange).toFixed(2)}% in ${alert.timeframeMinutes} minutes`);
                    console.log(`   Start: $${oldestPrice.price.toFixed(6)} -> Current: $${currentPrice.toFixed(6)}`);

                    this.io.emit('alert', {
                        symbol,
                        priceChange: priceChange.toFixed(2),
                        timeframe: alert.timeframeMinutes,
                        threshold: alert.thresholdPercent,
                        startPrice: oldestPrice.price,
                        currentPrice,
                        timestamp: now,
                        status: 'triggered'
                    });

                    await this.prisma.alert.update({
                        where: { id: alert.id },
                        data: {
                            active: false,
                            status: 'triggered',
                            triggeredAt: now,
                            updatedAt: now
                        }
                    });
                }
            }
        } catch (error) {
            console.error(`Error checking alerts for ${symbol}:`, error);
            throw error;
        }
    }

    async getAlerts(where: any = {}) {
        return await this.prisma.alert.findMany({
            where,
            orderBy: [
                { status: 'asc' },  // pending first
                { createdAt: 'desc' }
            ],
            select: {
                id: true,
                symbol: true,
                thresholdPercent: true,
                timeframeMinutes: true,
                active: true,
                status: true,
                triggeredAt: true,
                createdAt: true,
                updatedAt: true
            }
        });
    }
}