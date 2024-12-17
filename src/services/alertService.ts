import { PrismaClient } from '@prisma/client';
import { PriceAlert } from '../types';
import { Server } from 'socket.io';

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
        const activeAlerts = await this.prisma.alert.findMany({
            where: { symbol, active: true }
        });

        for (const alert of activeAlerts) {
            const prices = await this.prisma.priceHistory.findMany({
                where: {
                    token: symbol,
                    timestamp: {
                        gte: new Date(Date.now() - alert.timeframeMinutes * 60 * 1000)
                    }
                },
                orderBy: { timestamp: 'asc' }
            });

            if (prices.length < 2) continue;

            const oldestPrice = prices[0].price;
            const priceChange = ((currentPrice - oldestPrice) / oldestPrice) * 100;

            if (Math.abs(priceChange) >= alert.thresholdPercent) {
                this.io.emit('alert', {
                    symbol,
                    priceChange: priceChange.toFixed(2),
                    timeframe: alert.timeframeMinutes,
                    threshold: alert.thresholdPercent
                });

                // Deactivate the alert after triggering
                await this.prisma.alert.update({
                    where: { id: alert.id },
                    data: { active: false }
                });
            }
        }
    }
} 