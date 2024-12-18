import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';

export const setupTestEnv = () => {
    // Create Express app
    const app = express();
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    const prisma = new PrismaClient();

    // Middleware
    app.use(cors());
    app.use(express.json());

    return {
        app,
        httpServer,
        io,
        prisma,
        cleanup: async () => {
            await prisma.$disconnect();
            await new Promise<void>((resolve) => {
                httpServer.close(() => resolve());
            });
        }
    };
};