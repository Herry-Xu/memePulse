import { birdeyeService } from '../services/birdeyeService';
import { config } from '../config/config';

async function testBirdeyeEndpoints() {
    try {
        // Test token (WIF)
        const tokenAddress = config.tokens.WIF;
        console.log('\n🧪 Testing Birdeye API endpoints with WIF token...\n');

        // Test price endpoint
        console.log('Testing getTokenPrice...');
        const price = await birdeyeService.getTokenPrice(tokenAddress);
        console.log('✅ Price:', price);

        // Test token stats
        console.log('\nTesting getTokenStats...');
        const stats = await birdeyeService.getTokenStats(tokenAddress);
        console.log('✅ Token Stats:', JSON.stringify(stats, null, 2));

        // Test market data
        console.log('\nTesting getTokenMarketData...');
        const marketData = await birdeyeService.getTokenMarketData(tokenAddress);
        console.log('✅ Market Data:', JSON.stringify(marketData, null, 2));

        // Test 24h volume
        console.log('\nTesting get24HourVolume...');
        const volumeData = await birdeyeService.get24HourVolume(tokenAddress);
        console.log('✅ 24h Volume Data:', JSON.stringify(volumeData, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run tests
testBirdeyeEndpoints(); 