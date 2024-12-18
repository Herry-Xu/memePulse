import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Solana Memecoin Monitor API',
            version: '1.0.0',
            description: 'API for monitoring Solana memecoin prices and setting price alerts'
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                TokenPrice: {
                    type: 'object',
                    properties: {
                        symbol: { type: 'string', example: 'WIF' },
                        price: { type: 'number', example: 0.0123 },
                        timestamp: { type: 'string', format: 'date-time' }
                    }
                },
                TokenStats: {
                    type: 'object',
                    properties: {
                        symbol: { type: 'string', example: 'WIF' },
                        name: { type: 'string', example: 'Woof' },
                        price: { type: 'number', example: 0.0123 },
                        supply: { type: 'number', example: 1000000000 },
                        marketCap: { type: 'number' },
                        volume24h: { type: 'number' },
                        volumeChange24h: { type: 'number' },
                        liquidity: { type: 'number' }
                    }
                },
                Alert: {
                    type: 'object',
                    required: ['symbol', 'thresholdPercent', 'timeframeMinutes'],
                    properties: {
                        symbol: { 
                            type: 'string', 
                            enum: ['WIF', 'BONK'],
                            description: 'Token symbol'
                        },
                        thresholdPercent: { 
                            type: 'number',
                            minimum: 0.1,
                            description: 'Price change threshold percentage',
                            example: 5
                        },
                        timeframeMinutes: { 
                            type: 'integer',
                            minimum: 1,
                            description: 'Time window to monitor in minutes',
                            example: 60
                        },
                        active: {
                            type: 'boolean',
                            description: 'Whether the alert is active',
                            example: true
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'triggered', 'expired'],
                            description: 'Current status of the alert',
                            example: 'pending'
                        },
                        triggeredAt: {
                            type: 'string',
                            format: 'date-time',
                            nullable: true,
                            description: 'When the alert was triggered (if applicable)'
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' }
                    }
                },
                PriceHistory: {
                    type: 'object',
                    properties: {
                        symbol: { type: 'string', example: 'WIF' },
                        time_from: { type: 'integer', example: 1647123600 },
                        time_to: { type: 'integer', example: 1647127200 },
                        percentageChange: { type: 'number', example: 5.23 },
                        prices: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    unixTime: { type: 'integer' },
                                    value: { type: 'number' }
                                }
                            }
                        }
                    }
                }
            }
        },
        tags: [
            {
                name: 'Tokens',
                description: 'Token price and market data operations'
            },
            {
                name: 'Alerts',
                description: 'Price alert management'
            }
        ]
    },
    apis: ['./src/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options); 