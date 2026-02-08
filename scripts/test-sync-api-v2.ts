// @ts-nocheck
async function testSync() {
    console.log('Testing /api/sync endpoint...');
    try {
        const res = await fetch('http://localhost:3000/api/sync');
        const json = await res.json();
        console.log('Sync Success:', json.success);

        if (json.data) {
            const stockCount = json.data.stocks?.length || 0;
            const cryptoCount = json.data.cryptos?.length || 0;
            console.log('--- DATA COUNTS ---');
            console.log(`Stocks fetched:  ${stockCount}`);
            console.log(`Cryptos fetched: ${cryptoCount}`);

            if (stockCount > 0) {
                console.log('Sample Stock:', json.data.stocks[0].symbol, '-', json.data.stocks[0].name);
            }
            if (cryptoCount > 0) {
                console.log('Sample Crypto:', json.data.cryptos[0].symbol, '-', json.data.cryptos[0].name);
            }
        } else {
            console.log('No data object in response.');
        }

    } catch (e) {
        console.error('Fetch failed:', e.message);
    }
}

testSync();
