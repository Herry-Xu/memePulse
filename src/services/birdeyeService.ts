import axios from 'axios';
import { config } from '../config/config';

class BirdeyeService {
    private readonly API_KEY: string;
    private readonly BASE_URL = 'https://public-api.birdeye.so/defi';

    constructor() {
        this.API_KEY = config.birdeyeApiKey;
    }

    /**
     * Get current price of a token
     * Endpoint: GET /defi/price
     * @param tokenAddress The token's address
     * @returns Current token price
     */
    async getTokenPrice(tokenAddress: string): Promise<number> {
        try {
            const response = await axios.get(
                `${this.BASE_URL}/price`,
                {
                    params: { address: tokenAddress },
                    headers: { 
                        'X-API-KEY': this.API_KEY,
                        'x-chain': 'solana'
                    }
                }
            );
            
            if (response.data?.success && response.data?.data?.value) {
                return response.data.data.value;
            }
            throw new Error('Unexpected API response structure');
        } catch (error) {
            console.error(`Error fetching price for token ${tokenAddress}:`, error);
            throw error;
        }
    }

    /**
     * Get token metadata and information
     * Endpoint: GET /defi/v3/token/meta-data/single
     * @param tokenAddress The token's address
     * @returns Token metadata
     */
    async getTokenStats(tokenAddress: string) {
        try {
            const response = await axios.get(
                `${this.BASE_URL}/v3/token/meta-data/single`,
                {
                    params: { address: tokenAddress },
                    headers: { 
                        'X-API-KEY': this.API_KEY,
                        'x-chain': 'solana'
                    }
                }
            );
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching stats for token ${tokenAddress}:`, error);
            throw error;
        }
    }

    /**
     * Get token market data including liquidity, supply, and marketcap
     * Endpoint: GET /defi/v3/token/market-data
     * @param tokenAddress The token's address
     * @returns Token market data
     */
    async getTokenMarketData(tokenAddress: string) {
        try {
            const response = await axios.get(
                `${this.BASE_URL}/v3/token/market-data`,
                {
                    params: { address: tokenAddress },
                    headers: { 
                        'X-API-KEY': this.API_KEY,
                        'x-chain': 'solana'
                    }
                }
            );
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching market data for token ${tokenAddress}:`, error);
            throw error;
        }
    }

    /**
     * Get 24-hour price and volume data
     * Endpoint: GET /defi/price_volume/single
     * @param tokenAddress The token's address
     * @returns 24h volume and price change data
     */
    async get24HourVolume(tokenAddress: string) {
        try {
            const response = await axios.get(
                `${this.BASE_URL}/price_volume/single`,
                {
                    params: { 
                        address: tokenAddress,
                        type: '24h'
                    },
                    headers: { 
                        'X-API-KEY': this.API_KEY,
                        'x-chain': 'solana'
                    }
                }
            );
            return response.data.data;
        } catch (error) {
            console.error(`Error fetching 24h volume for token ${tokenAddress}:`, error);
            throw error;
        }
    }
}

export const birdeyeService = new BirdeyeService(); 