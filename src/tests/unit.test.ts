import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { AlertService } from '../services/alertService';
import { createServer } from 'http';

describe('Alert Service Tests', () => {
    let prisma: PrismaClient;
    let io: Server;
    let alertService: AlertService;
    let mockEmit: jest.SpyInstance;

    beforeAll(() => {
        const httpServer = createServer();
        io = new Server(httpServer);
        prisma = new PrismaClient();
        alertService = new AlertService(prisma, io);
        mockEmit = jest.spyOn(io, 'emit');
    });

    beforeEach(async () => {
        await prisma.alert.deleteMany();
        await prisma.priceHistory.deleteMany();
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Alert Creation and Triggering', () => {
        it('should create new alert', async () => {
            const alert = await alertService.createAlert({
                symbol: 'WIF',
                thresholdPercent: 5,
                timeframeMinutes: 60
            });

            expect(alert).toMatchObject({
                symbol: 'WIF',
                thresholdPercent: 5,
                timeframeMinutes: 60,
                active: true,
                status: 'pending'
            });
        });

        it('should trigger alert on price increase', async () => {
            // Create historical price data
            await prisma.priceHistory.create({
                data: {
                    token: 'WIF',
                    price: 100.0,
                    timestamp: new Date(Date.now() - 30 * 60 * 1000)
                }
            });

            const alert = await alertService.createAlert({
                symbol: 'WIF',
                thresholdPercent: 5,
                timeframeMinutes: 60
            });

            await alertService.checkAlerts('WIF', 110.0);

            expect(mockEmit).toHaveBeenCalledWith('alert', expect.objectContaining({
                symbol: 'WIF',
                priceChange: '10.00',
                status: 'triggered'
            }));

            const updatedAlert = await prisma.alert.findFirst({
                where: { id: alert.id }
            });
            expect(updatedAlert).toMatchObject({
                active: false,
                status: 'triggered',
                triggeredAt: expect.any(Date)
            });
        });

        it('should not trigger alert on small price change', async () => {
            await prisma.priceHistory.create({
                data: {
                    token: 'WIF',
                    price: 100.0,
                    timestamp: new Date(Date.now() - 30 * 60 * 1000)
                }
            });

            await alertService.createAlert({
                symbol: 'WIF',
                thresholdPercent: 5,
                timeframeMinutes: 60
            });

            await alertService.checkAlerts('WIF', 102.0); // 2% increase

            expect(mockEmit).not.toHaveBeenCalled();
        });

        it('should expire alert after timeframe', async () => {
            const oldTimestamp = new Date(Date.now() - 120 * 60 * 1000); // 2 hours ago
            await prisma.priceHistory.create({
                data: {
                    token: 'WIF',
                    price: 100.0,
                    timestamp: oldTimestamp
                }
            });

            const alert = await alertService.createAlert({
                symbol: 'WIF',
                thresholdPercent: 5,
                timeframeMinutes: 60
            });

            // Set alert creation time to past
            await prisma.alert.update({
                where: { id: alert.id },
                data: { createdAt: oldTimestamp }
            });

            await alertService.checkAlerts('WIF', 110.0);

            const expiredAlert = await prisma.alert.findFirst({
                where: { id: alert.id }
            });
            expect(expiredAlert).toMatchObject({
                active: false,
                status: 'expired'
            });
        });
    });

    describe('Alert Querying', () => {
        it('should get all alerts', async () => {
            await alertService.createAlert({
                symbol: 'WIF',
                thresholdPercent: 5,
                timeframeMinutes: 60
            });

            const alerts = await alertService.getAlerts();
            expect(alerts).toHaveLength(1);
            expect(alerts[0]).toMatchObject({
                symbol: 'WIF',
                active: true,
                status: 'pending'
            });
        });

        it('should filter alerts by status', async () => {
            await alertService.createAlert({
                symbol: 'WIF',
                thresholdPercent: 5,
                timeframeMinutes: 60
            });

            const activeAlerts = await alertService.getAlerts({ active: true });
            expect(activeAlerts).toHaveLength(1);

            const inactiveAlerts = await alertService.getAlerts({ active: false });
            expect(inactiveAlerts).toHaveLength(0);
        });
    });
});