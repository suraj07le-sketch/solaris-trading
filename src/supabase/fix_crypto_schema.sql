-- ==========================================
-- UNIFY CRYPTO_COINS SCHEMA
-- ==========================================
-- This script ensures that 'crypto_coins' table has all the actual needed columns,
-- while maintaining backward compatibility with legacy column names.

DO $$
BEGIN
    -- Ensure table exists (plural is our standard)
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crypto_coins') THEN
        CREATE TABLE public.crypto_coins (
            id text PRIMARY KEY,
            symbol text NOT NULL,
            name text NOT NULL
        );
    END IF;

    -- Add standard columns if they are missing
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS current_price numeric;
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS market_cap numeric;
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS market_cap_rank integer;
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS price_change_percentage_24h numeric;
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS high_24h numeric;
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS low_24h numeric;
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS volume numeric;
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS image text;
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

    -- Add legacy/alias columns if they are missing (to prevent code errors)
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS price_usd numeric;
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS change_24h numeric;
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS market_cap_usd numeric;
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS volume_24h numeric;
    ALTER TABLE public.crypto_coins ADD COLUMN IF NOT EXISTS rank integer;

    -- Update legacy columns from standard ones if they are null
    UPDATE public.crypto_coins SET price_usd = current_price WHERE price_usd IS NULL;
    UPDATE public.crypto_coins SET change_24h = price_change_percentage_24h WHERE change_24h IS NULL;
    UPDATE public.crypto_coins SET market_cap_usd = market_cap WHERE market_cap_usd IS NULL;
    UPDATE public.crypto_coins SET volume_24h = volume WHERE volume_24h IS NULL;
    UPDATE public.crypto_coins SET rank = market_cap_rank WHERE rank IS NULL;

    -- Update standard columns from legacy ones if they are null
    UPDATE public.crypto_coins SET current_price = price_usd WHERE current_price IS NULL AND price_usd IS NOT NULL;
    UPDATE public.crypto_coins SET price_change_percentage_24h = change_24h WHERE price_change_percentage_24h IS NULL AND change_24h IS NOT NULL;
    UPDATE public.crypto_coins SET market_cap = market_cap_usd WHERE market_cap IS NULL AND market_cap_usd IS NOT NULL;
    UPDATE public.crypto_coins SET volume = volume_24h WHERE volume IS NULL AND volume_24h IS NOT NULL;
    UPDATE public.crypto_coins SET market_cap_rank = rank WHERE market_cap_rank IS NULL AND rank IS NOT NULL;

END $$;
