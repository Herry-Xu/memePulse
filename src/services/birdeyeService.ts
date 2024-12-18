import axios from 'axios';
import { config } from '../config/config';

interface MarketData {
    address: string;
    price: number;
    liquidity: number;
    supply: number;
    marketcap: number;
    circulating_supply: number;
    circulating_marketcap: number;
}

interface HolderData {
    amount: string;
    decimals: number;
    mint: string;
    owner: string;
    token_account: string;
    ui_amount: number;
}

interface HistoricalPrice {
    unixTime: number;
    value: number;
}

class BirdeyeService {
    private readonly API_KEY: string;
    private readonly BASE_URL = 'https://public-api.birdeye.so/defi';

    constructor() {
        this.API_KEY = config.birdeyeApiKey;
    }

    /**
     * Get current price and 24h change of a token
     * Endpoint: GET /defi/price_volume/single
     * @param tokenAddress The token's address
     * @returns Current price and 24h change
     */
    async getTokenPrice(tokenAddress: string): Promise<{
        price: number;
        priceChangePercent: number;
    }> {
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

            if (!response.data?.success) {
                throw new Error('Failed to fetch price from BirdEye');
            }

            const { price, priceChangePercent } = response.data.data;
            return {
                price,
                priceChangePercent,
            };
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

    /**
     * Get detailed market data for a token
     * Endpoint: GET /defi/v3/token/market-data
     * @param tokenAddress The token's address
     * @returns Detailed market data including supply and marketcap
     */
    async getMarketData(tokenAddress: string): Promise<MarketData> {
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

            if (!response.data?.success) {
                throw new Error('Failed to fetch market data from BirdEye');
            }

            return response.data.data;
        } catch (error) {
            console.error(`Error fetching market data for token ${tokenAddress}:`, error);
            throw error;
        }
    }

    /**
     * Get top token holders
     * Endpoint: GET /defi/v3/token/holder
     * @param tokenAddress The token's address
     * @param limit Number of holders to return (default 10)
     * @param offset Pagination offset (default 0)
     * @returns List of top token holders with their holdings
     */
    async getTopHolders(
        tokenAddress: string, 
        limit: number = 10, 
        offset: number = 0
    ): Promise<HolderData[]> {
        try {
            const response = await axios.get(
                `${this.BASE_URL}/v3/token/holder`,
                {
                    params: { 
                        address: tokenAddress,
                        limit,
                        offset 
                    },
                    headers: {
                        'X-API-KEY': this.API_KEY,
                        'x-chain': 'solana'
                    }
                }
            );

            if (!response.data?.success) {
                throw new Error('Failed to fetch holder data from BirdEye');
            }

            return response.data.data.items;
        } catch (error) {
            console.error(`Error fetching holders for token ${tokenAddress}:`, error);
            throw error;
        }
    }

    /**
     * Get historical price data for a token
     * Endpoint: GET /defi/history_price
     * @param tokenAddress The token's address
     * @param timeFrom Start time in Unix timestamp (seconds)
     * @param timeTo End time in Unix timestamp (seconds)
     * @param interval Time interval (1m,3m,5m,15m,30m,1H,2H,4H,6H,8H,12H,1D,3D,1W,1M)
     * @returns Array of historical price data points
     */
    async getHistoricalPrices(
        tokenAddress: string,
        timeFrom: number,
        timeTo: number,
        interval: string = '15m'
    ): Promise<HistoricalPrice[]> {
        try {
            const response = await axios.get(
                `${this.BASE_URL}/history_price`,
                {
                    params: {
                        address: tokenAddress,
                        address_type: 'token',
                        type: interval,
                        time_from: timeFrom,
                        time_to: timeTo
                    },
                    headers: {
                        'X-API-KEY': this.API_KEY,
                        'x-chain': 'solana'
                    }
                }
            );

            if (!response.data?.success) {
                throw new Error('Failed to fetch historical prices from BirdEye');
            }

            return response.data.data.items.map((item: any) => ({
                unixTime: item.unixTime,
                value: item.value
            }));
        } catch (error) {
            console.error(`Error fetching historical prices for token ${tokenAddress}:`, error);
            throw error;
        }
    }
}

export const birdeyeService = new BirdeyeService(); 