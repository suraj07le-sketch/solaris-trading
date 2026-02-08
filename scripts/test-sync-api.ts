// @ts-nocheck
async function testSync() {
    console.log('Testing /api/sync endpoint...');
    try {
        const res = await fetch('http://localhost:3000/api/sync', {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const json = await res.json();
        console.log('Sync Success:', json.success);
        console.log('Stocks fetched:', json.data?.stocks?.length || 0);
        console.log('Cryptos fetched:', json.data?.cryptos?.length || 0);

        if (json.data?.stocks?.length > 0) {
            console.log('Sample stock:', json.data.stocks[0].symbol, json.data.stocks[0].name);
        }
    } catch (e) {
        console.error('Fetch failed (is server running?):', e.message);
    }
}

testSync();
