import { Request, Response } from 'express';
import { PriceMonitorService } from '../services/priceMonitorService';
import { birdeyeService } from '../services/birdeyeService';
import { config } from '../config/config';

export class TokenController {
    private priceMonitorService: PriceMonitorService;

    constructor(priceMonitorService: PriceMonitorService) {
        this.priceMonitorService = priceMonitorService;
    }

    // GET /tokens/:symbol
    async getCurrentPrice(req: Request, res: Response) {
        try {
            const { symbol } = req.params;
            const address = config.tokens[symbol as keyof typeof config.tokens];

            if (!address) {
                return res.status(404).json({ error: 'Token not found' });
            }

            const price = await birdeyeService.getTokenPrice(address);
            const change24h = await this.priceMonitorService.calculatePriceChange(symbol, 1440);

            return res.json({
                symbol,
                currentPrice: price,
                change24h: `${change24h.toFixed(2)}%`
            });
        } catch (error) {
            console.error('Error fetching current price:', error);
            return res.status(500).json({ error: 'Failed to fetch current price' });
        }
    }

    // GET /tokens/:symbol/history
    async getPriceHistory(req: Request, res: Response) {
        try {
            const { symbol } = req.params;
            const { timeframe = '60' } = req.query; // Default to 1 hour

            if (!config.tokens[symbol as keyof typeof config.tokens]) {
                return res.status(404).json({ error: 'Token not found' });
            }

            const history = await this.priceMonitorService.getPriceHistory(
                symbol,
                parseInt(timeframe as string)
            );

            return res.json(history);
        } catch (error) {
            console.error('Error fetching price history:', error);
            return res.status(500).json({ error: 'Failed to fetch price history' });
        }
    }

    // GET /tokens/:symbol/stats
    async getTokenStats(req: Request, res: Response) {
        try {
            const { symbol } = req.params;
            const address = config.tokens[symbol as keyof typeof config.tokens];

            if (!address) {
                return res.status(404).json({ error: 'Token not found' });
            }

            const stats = await birdeyeService.getTokenStats(address);
            return res.json(stats);
        } catch (error) {
            console.error('Error fetching token stats:', error);
            return res.status(500).json({ error: 'Failed to fetch token stats' });
        }
    }
} 