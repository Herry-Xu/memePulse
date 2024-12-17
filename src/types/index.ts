export interface TokenPrice {
    symbol: string;
    price: number;
    timestamp: Date;
}

export interface PriceAlert {
    symbol: string;
    thresholdPercent: number;
    timeframeMinutes: number;
}

export interface TokenStats {
    symbol: string;
    price: number;
    volume24h: number;
    marketCap: number;
    holders?: number;
} 