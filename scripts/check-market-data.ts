import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log('--- Checking Market Data Tables ---');

    console.log('Checking indian_stocks...');
    const { count: stockCount, error: stockError } = await supabase
        .from('indian_stocks')
        .select('*', { count: 'exact', head: true });

    if (stockError) {
        console.error('Error indian_stocks:', stockError);
    } else {
        console.log('indian_stocks count:', stockCount);
    }

    console.log('Checking crypto_coins...');
    const { count: cryptoCount, error: cryptoError } = await supabase
        .from('crypto_coins')
        .select('*', { count: 'exact', head: true });

    if (cryptoError) {
        console.error('Error crypto_coins:', cryptoError);
    } else {
        console.log('crypto_coins count:', cryptoCount);
    }

    if (stockCount === 0 || cryptoCount === 0) {
        console.log('Tables are empty. You should run sync.');
    }
}

check();
