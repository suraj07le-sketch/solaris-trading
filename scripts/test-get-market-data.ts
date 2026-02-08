// @ts-nocheck
import { getMarketData } from './src/lib/api';

async function test() {
    console.log('Testing getMarketData("stock")...');
    const stocks = await getMarketData('stock');
    console.log('Stocks count:', stocks.length);
    if (stocks.length > 0) {
        console.log('Sample stock:', JSON.stringify(stocks[0], null, 2));
    }

    console.log('\nTesting getMarketData("crypto")...');
    const cryptos = await getMarketData('crypto');
    console.log('Cryptos count:', cryptos.length);
    if (cryptos.length > 0) {
        console.log('Sample crypto:', JSON.stringify(cryptos[0], null, 2));
    }
}

test();
