import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/config';
import { PrismaClient } from '@prisma/client';
import { PriceMonitorService } from './services/priceMonitorService';
import { TokenController } from './controllers/tokenController';
import { AlertService } from './services/alertService';
import { AlertController } from './controllers/alertController';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Initialize services
export const prisma = new PrismaClient();
const alertService = new AlertService(prisma, io);
const priceMonitorService = new PriceMonitorService(io, alertService);
const tokenController = new TokenController(priceMonitorService);
const alertController = new AlertController(alertService);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (_, res) => {
    res.json({ status: 'ok' });
});

app.get('/tokens/:symbol', tokenController.getCurrentPrice.bind(tokenController));
app.get('/tokens/:symbol/history', tokenController.getPriceHistory.bind(tokenController));
app.get('/tokens/:symbol/stats', tokenController.getTokenStats.bind(tokenController));
app.post('/alerts', alertController.createAlert.bind(alertController));

// Start price monitoring
priceMonitorService.startMonitoring();

// Start server
httpServer.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});

// Cleanup on shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down...');
    priceMonitorService.stopMonitoring();
    await prisma.$disconnect();
    process.exit(0);
}); 