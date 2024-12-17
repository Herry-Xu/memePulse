import { Request, Response } from 'express';
import { AlertService } from '../services/alertService';
import { config } from '../config/config';

export class AlertController {
    private alertService: AlertService;

    constructor(alertService: AlertService) {
        this.alertService = alertService;
    }

    async createAlert(req: Request, res: Response) {
        try {
            const { symbol, thresholdPercent, timeframeMinutes } = req.body;

            // Validate input
            if (!symbol || !thresholdPercent || !timeframeMinutes) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            if (!config.tokens[symbol as keyof typeof config.tokens]) {
                return res.status(404).json({ error: 'Token not supported' });
            }

            const alert = await this.alertService.createAlert({
                symbol,
                thresholdPercent,
                timeframeMinutes
            });

            return res.json(alert);
        } catch (error) {
            console.error('Error creating alert:', error);
            return res.status(500).json({ error: 'Failed to create alert' });
        }
    }
} 