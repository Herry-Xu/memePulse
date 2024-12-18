import { Request, Response } from 'express';
import { birdeyeService } from '../services/birdeyeService';
import { config } from '../config/config';
import { PrismaClient } from '@prisma/client';

export class TokenController {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    /**
     * @swagger
     * /tokens/{symbol}:
     *   get:
     *     summary: Get current price for a token
     *     tags: [Tokens]
     *     parameters:
     *       - in: path
     *         name: symbol
     *         required: true
     *         schema:
     *           type: string
     *           enum: [WIF, BONK]
     *     responses:
     *       200:
     *         description: Current token price
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/TokenPrice'
     *       404:
     *         description: Token not found
     */
    async getCurrentPrice(req: Request, res: Response) {
        try {
            const { symbol } = req.params;
            const address = config.tokens[symbol as keyof typeof config.tokens];

            if (!address) {
                return res.status(404).json({ error: 'Token not found' });
            }

            const { price, priceChangePercent } = await birdeyeService.getTokenPrice(address);

            return res.json({
                symbol,
                currentPrice: price,
                change24h: `${priceChangePercent.toFixed(2)}%`
            });
        } catch (error) {
            console.error('Error fetching current price:', error);
            return res.status(500).json({ error: 'Failed to fetch current price' });
        }
    }

    /**
     * @swagger
     * /tokens/{symbol}/history:
     *   get:
     *     summary: Get token price history
     *     tags: [Tokens]
     *     parameters:
     *       - in: path
     *         name: symbol
     *         required: true
     *         schema:
     *           type: string
     *         description: Token symbol (e.g., WIF, BONK)
     *       - in: query
     *         name: time_from
     *         schema:
     *           type: integer
     *         description: Start time in Unix timestamp (seconds)
     *       - in: query
     *         name: time_to
     *         schema:
     *           type: integer
     *         description: End time in Unix timestamp (seconds)
     *     responses:
     *       200:
     *         description: Historical price data
     *       404:
     *         description: Token not found
     */
    async getPriceHistory(req: Request, res: Response) {
        try {
            const { symbol } = req.params;
            const {
                time_from = Math.floor(Date.now() / 1000) - (60 * 60), // Default 1 hour ago
                time_to = Math.floor(Date.now() / 1000) // Default now
            } = req.query;

            if (!config.tokens[symbol as keyof typeof config.tokens]) {
                return res.status(404).json({ error: 'Token not found' });
            }

            const prices = await this.prisma.priceHistory.findMany({
                where: {
                    token: symbol,
                    timestamp: {
                        gte: new Date(Number(time_from) * 1000),
                        lte: new Date(Number(time_to) * 1000)
                    }
                },
                orderBy: {
                    timestamp: 'asc'
                },
                select: {
                    price: true,
                    timestamp: true
                }
            });

            // Calculate percentage change
            let percentageChange = 0;
            if (prices.length >= 2) {
                const startPrice = prices[0].price;
                const endPrice = prices[prices.length - 1].price;
                percentageChange = ((endPrice - startPrice) / startPrice) * 100;
            }

            return res.json({
                symbol,
                time_from: Number(time_from),
                time_to: Number(time_to),
                percentageChange: Number(percentageChange.toFixed(2)),
                prices: prices.map((p: any) => ({
                    unixTime: Math.floor(p.timestamp.getTime() / 1000),
                    value: p.price
                }))
            });
        } catch (error) {
            console.error('Error fetching price history:', error);
            return res.status(500).json({ error: 'Failed to fetch price history' });
        }
    }

    /**
     * @swagger
     * /tokens/{symbol}/stats:
     *   get:
     *     summary: Get comprehensive token statistics
     *     tags: [Tokens]
     *     parameters:
     *       - in: path
     *         name: symbol
     *         required: true
     *         schema:
     *           type: string
     *           enum: [WIF, BONK]
     *     responses:
     *       200:
     *         description: Comprehensive token statistics
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 symbol:
     *                   type: string
     *                 price:
     *                   type: number
     *                 priceChange24h:
     *                   type: string
     *                 volume24h:
     *                   type: number
     *                 marketCap:
     *                   type: number
     *                 supply:
     *                   type: number
     *                 holders:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       owner:
     *                         type: string
     *                       percentage:
     *                         type: number
     */
    async getTokenStats(req: Request, res: Response) {
        try {
            const { symbol } = req.params;
            const address = config.tokens[symbol as keyof typeof config.tokens];

            if (!address) {
                return res.status(404).json({ error: 'Token not found' });
            }

            // Fetch all data in parallel
            const [
                priceData,
                marketData,
                topHolders
            ] = await Promise.all([
                birdeyeService.getTokenPrice(address),
                birdeyeService.getMarketData(address),
                birdeyeService.getTopHolders(address, 5) // Get top 5 holders
            ]);

            return res.json({
                symbol,
                price: priceData.price,
                priceChange24h: `${priceData.priceChangePercent.toFixed(2)}%`,
                marketCap: marketData.marketcap,
                circulatingSupply: marketData.circulating_supply,
                totalSupply: marketData.supply,
                liquidity: marketData.liquidity,
                topHolders: topHolders.map(holder => ({
                    owner: holder.owner,
                    amount: holder.ui_amount
                }))
            });
        } catch (error) {
            console.error('Error fetching token stats:', error);
            return res.status(500).json({ error: 'Failed to fetch token stats' });
        }
    }
} 