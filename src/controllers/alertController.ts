import { Request, Response } from 'express';
import { AlertService } from '../services/alertService';
import { config } from '../config/config';

/**
 * @swagger
 * tags:
 *   - name: Alerts
 *     description: Price alert management
 *   - name: Tokens
 *     description: Token price and statistics
 * 
 * /alerts:
 *   post:
 *     summary: Create a new price alert
 *     tags: [Alerts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symbol
 *               - thresholdPercent
 *               - timeframeMinutes
 *             properties:
 *               symbol:
 *                 type: string
 *                 enum: [WIF, BONK]
 *                 description: Token symbol
 *               thresholdPercent:
 *                 type: number
 *                 minimum: 0.1
 *                 description: Price change threshold percentage
 *               timeframeMinutes:
 *                 type: integer
 *                 minimum: 1
 *                 description: Time window to monitor in minutes
 *     responses:
 *       200:
 *         description: Alert created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Alert'
 *       400:
 *         description: Invalid input parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Token not found
 *   get:
 *     summary: Get all alerts
 *     tags: [Alerts]
 *     parameters:
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filter by active status (optional)
 *     responses:
 *       200:
 *         description: List of alerts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Alert'
 */

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

    async getAlerts(req: Request, res: Response) {
        try {
            const { active } = req.query;
            const where = active !== undefined ? { active: active === 'true' } : {};

            const alerts = await this.alertService.getAlerts(where);
            return res.json(alerts);
        } catch (error) {
            console.error('Error fetching alerts:', error);
            return res.status(500).json({ error: 'Failed to fetch alerts' });
        }
    }
} 