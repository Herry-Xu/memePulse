import { jest } from '@jest/globals';

// Mock environment variables
process.env.BIRDEYE_API_KEY = 'test-api-key';
process.env.PORT = '3000';

// Mock BirdEye API responses
jest.mock('../services/birdeyeService', () => ({
    birdeyeService: {
        getHistoricalPrices: jest.fn(() => Promise.resolve([
            { unixTime: Math.floor(Date.now() / 1000), value: 1.0 }
        ])),
        getTokenPrice: jest.fn(() => Promise.resolve({
            price: 1.0,
            priceChangePercent: 5.0
        }))
    }
}));