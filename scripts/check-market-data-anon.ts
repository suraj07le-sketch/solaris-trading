import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log('--- Checking Market Data Tables (Anon Key) ---');

    console.log('Checking indian_stocks...');
    const { data: stocks, error: stockError } = await supabase
        .from('indian_stocks')
        .select('*')
        .limit(1);

    if (stockError) {
        console.error('Error indian_stocks:', stockError);
    } else {
        console.log('indian_stocks access success, rows returned:', stocks?.length);
    }

    console.log('Checking crypto_coins...');
    const { data: cryptos, error: cryptoError } = await supabase
        .from('crypto_coins')
        .select('*')
        .limit(1);

    if (cryptoError) {
        console.error('Error crypto_coins:', cryptoError);
    } else {
        console.log('crypto_coins access success, rows returned:', cryptos?.length);
    }
}

check();
