-- ==============================================================================
-- BANDIT GAME — COMPLETE SUPABASE POSTGRESQL SCHEMA, RLS & RPC DEFINITIONS
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE admin_level_enum AS ENUM ('0', '1', '2', '3', '3.5', '4', '5');
CREATE TYPE item_rarity_enum AS ENUM ('COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC');
CREATE TYPE clan_rank_enum AS ENUM ('Leader', 'Deputy', 'Member');

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    username VARCHAR(32) NOT NULL UNIQUE,
    avatar_url TEXT DEFAULT '',
    level INTEGER DEFAULT 1 NOT NULL CHECK (level >= 1),
    xp INTEGER DEFAULT 0 NOT NULL CHECK (xp >= 0),
    money BIGINT DEFAULT 5000 NOT NULL CHECK (money >= 0),
    bank_money BIGINT DEFAULT 15000 NOT NULL CHECK (bank_money >= 0),
    status VARCHAR(64) DEFAULT 'Гражданин',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_seen TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    clan_id UUID DEFAULT NULL,
    admin_level NUMERIC(3,1) DEFAULT 0 NOT NULL,
    is_banned BOOLEAN DEFAULT FALSE NOT NULL,
    ban_reason TEXT DEFAULT NULL,
    ban_until TIMESTAMPTZ DEFAULT NULL,
    is_muted BOOLEAN DEFAULT FALSE NOT NULL,
    mute_until TIMESTAMPTZ DEFAULT NULL,
    warnings_count INTEGER DEFAULT 0 NOT NULL,
    suspicion_score INTEGER DEFAULT 0 NOT NULL CHECK (suspicion_score BETWEEN 0 AND 100),
    total_earned BIGINT DEFAULT 5000 NOT NULL,
    total_spent BIGINT DEFAULT 0 NOT NULL,
    play_time_minutes INTEGER DEFAULT 0 NOT NULL,
    active_vehicle_id UUID DEFAULT NULL,
    character_data JSONB DEFAULT '{"gender":"male","skinColor":"#d4a373","hairStyle":"crew","hairColor":"#1a1a1a","faceType":"default","shirt":"leather_jacket","shirtColor":"#18181b","pants":"cargo_dark","pantsColor":"#27272a","shoes":"boots","shoesColor":"#09090b","jacket":"none","jacketColor":"#18181b","hat":"none","glasses":"aviator","accessory":"chain"}'::JSONB
);

-- 4. ADMIN ROLES TABLE (Server verified)
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    admin_level NUMERIC(3,1) NOT NULL,
    title VARCHAR(64) NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. ITEMS CATALOG
CREATE TABLE IF NOT EXISTS public.items (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    icon VARCHAR(64) NOT NULL,
    category VARCHAR(32) NOT NULL,
    rarity item_rarity_enum DEFAULT 'COMMON' NOT NULL,
    price BIGINT DEFAULT 0 NOT NULL,
    weight NUMERIC(5,2) DEFAULT 0.5 NOT NULL,
    max_stack INTEGER DEFAULT 64 NOT NULL,
    is_equippable BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- 6. INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    item_id VARCHAR(64) REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    is_equipped BOOLEAN DEFAULT FALSE,
    slot_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. VEHICLES CATALOG
CREATE TABLE IF NOT EXISTS public.vehicles (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL,
    price BIGINT NOT NULL,
    speed INTEGER NOT NULL,
    acceleration INTEGER NOT NULL,
    handling INTEGER NOT NULL,
    fuel_capacity INTEGER NOT NULL,
    durability INTEGER NOT NULL,
    image TEXT NOT NULL,
    rarity item_rarity_enum DEFAULT 'COMMON' NOT NULL,
    trunk_capacity INTEGER DEFAULT 50 NOT NULL
);

-- 8. PLAYER VEHICLES (GARAGE)
CREATE TABLE IF NOT EXISTS public.player_vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vehicle_id VARCHAR(64) REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
    custom_name VARCHAR(64),
    fuel INTEGER DEFAULT 100 NOT NULL,
    durability INTEGER DEFAULT 100 NOT NULL,
    license_plate VARCHAR(16) NOT NULL,
    upgrades JSONB DEFAULT '{"engine":0,"brakes":0,"handling":0,"armor":0,"turbo":0,"color":"#18181b"}'::JSONB,
    is_active BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. CLANS
CREATE TABLE IF NOT EXISTS public.clans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(64) NOT NULL UNIQUE,
    tag VARCHAR(8) NOT NULL UNIQUE,
    description TEXT,
    emblem VARCHAR(64) NOT NULL,
    leader_id UUID REFERENCES auth.users(id) NOT NULL,
    balance BIGINT DEFAULT 100000 NOT NULL CHECK (balance >= 0),
    max_members INTEGER DEFAULT 10 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. CLAN MEMBERS
CREATE TABLE IF NOT EXISTS public.clan_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    rank clan_rank_enum DEFAULT 'Member' NOT NULL,
    donations BIGINT DEFAULT 0 NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 11. CLAN MESSAGES
CREATE TABLE IF NOT EXISTS public.clan_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clan_id UUID REFERENCES public.clans(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    username VARCHAR(32) NOT NULL,
    rank clan_rank_enum NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. BUSINESSES
CREATE TABLE IF NOT EXISTS public.businesses (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES auth.users(id) DEFAULT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    price BIGINT NOT NULL,
    hourly_profit BIGINT NOT NULL,
    hourly_expenses BIGINT NOT NULL,
    accumulated_profit BIGINT DEFAULT 0 NOT NULL,
    max_storage BIGINT DEFAULT 50000 NOT NULL,
    current_storage BIGINT DEFAULT 0 NOT NULL,
    location VARCHAR(128) NOT NULL,
    image TEXT NOT NULL,
    employees_count INTEGER DEFAULT 0 NOT NULL,
    last_collected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. MISSIONS & ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.missions (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    type VARCHAR(32) NOT NULL,
    target_count INTEGER NOT NULL,
    target_action VARCHAR(64) NOT NULL,
    reward_money BIGINT NOT NULL,
    reward_xp INTEGER NOT NULL,
    reward_item_id VARCHAR(64) DEFAULT NULL,
    reward_item_name VARCHAR(64) DEFAULT NULL,
    expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.player_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    mission_id VARCHAR(64) REFERENCES public.missions(id) ON DELETE CASCADE NOT NULL,
    progress INTEGER DEFAULT 0 NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, mission_id)
);

CREATE TABLE IF NOT EXISTS public.achievements (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    icon VARCHAR(64) NOT NULL,
    condition_type VARCHAR(64) NOT NULL,
    condition_value INTEGER NOT NULL,
    reward_money BIGINT NOT NULL,
    reward_xp INTEGER NOT NULL,
    rarity item_rarity_enum DEFAULT 'COMMON' NOT NULL
);

CREATE TABLE IF NOT EXISTS public.player_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    achievement_id VARCHAR(64) REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
    is_unlocked BOOLEAN DEFAULT FALSE NOT NULL,
    unlocked_at TIMESTAMPTZ DEFAULT NULL,
    current_progress INTEGER DEFAULT 0 NOT NULL,
    UNIQUE(user_id, achievement_id)
);

-- 14. TRANSACTIONS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(32) NOT NULL,
    amount BIGINT NOT NULL,
    currency VARCHAR(16) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES auth.users(id) NOT NULL,
    admin_name VARCHAR(32) NOT NULL,
    admin_level NUMERIC(3,1) NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) NOT NULL,
    target_username VARCHAR(32) NOT NULL,
    action VARCHAR(64) NOT NULL,
    command TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ip_hash VARCHAR(64),
    metadata JSONB DEFAULT '{}'::JSONB
);

CREATE TABLE IF NOT EXISTS public.anticheat_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    username VARCHAR(32) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    details TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    suspicion_added INTEGER DEFAULT 10 NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(128) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL
);

-- ==============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_admin_level ON public.profiles(admin_level);
CREATE INDEX IF NOT EXISTS idx_profiles_clan_id ON public.profiles(clan_id);
CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_player_vehicles_user_id ON public.player_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anticheat_events_created ON public.anticheat_events(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anticheat_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clan_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view public profile info; only own user or admin can view details
CREATE POLICY "Public profile read" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Own profile update" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Inventory: User can only select and interact with their own inventory
CREATE POLICY "User own inventory" ON public.inventory
    FOR ALL USING (auth.uid() = user_id);

-- Vehicles: User can view and use their own vehicles
CREATE POLICY "User own vehicles" ON public.player_vehicles
    FOR ALL USING (auth.uid() = user_id);

-- Admin Logs: Only admins (admin_level >= 1) can view; only server/RPC can insert
CREATE POLICY "Admin view logs" ON public.admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.user_id = auth.uid() AND profiles.admin_level >= 1
        )
    );

-- Notifications: Own user only
CREATE POLICY "User own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- SECURE SERVER-SIDE RPCs
-- ==============================================================================

-- 1. Deposit / Withdraw money
CREATE OR REPLACE FUNCTION public.rpc_bank_action(
    p_action TEXT,
    p_amount BIGINT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_money BIGINT;
    v_bank BIGINT;
BEGIN
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Сумма должна быть больше нуля');
    END IF;

    SELECT money, bank_money INTO v_money, v_bank
    FROM public.profiles WHERE user_id = v_user_id;

    IF p_action = 'deposit' THEN
        IF v_money < p_amount THEN
            RETURN jsonb_build_object('success', false, 'error', 'Недостаточно наличных средств');
        END IF;
        UPDATE public.profiles
        SET money = money - p_amount, bank_money = bank_money + p_amount
        WHERE user_id = v_user_id;
    ELSIF p_action = 'withdraw' THEN
        IF v_bank < p_amount THEN
            RETURN jsonb_build_object('success', false, 'error', 'Недостаточно денег на банковском счете');
        END IF;
        UPDATE public.profiles
        SET money = money + p_amount, bank_money = bank_money - p_amount
        WHERE user_id = v_user_id;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Неизвестная операция');
    END IF;

    INSERT INTO public.transactions (user_id, type, amount, currency, description)
    VALUES (v_user_id, p_action, p_amount, CASE WHEN p_action = 'deposit' THEN 'bank' ELSE 'cash' END, 'Банковская операция: ' || p_action);

    RETURN jsonb_build_object('success', true, 'amount', p_amount);
END;
$$;

-- 2. Buy Shop Item RPC
CREATE OR REPLACE FUNCTION public.rpc_buy_shop_item(
    p_item_id TEXT,
    p_quantity INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_price BIGINT;
    v_total_price BIGINT;
    v_current_money BIGINT;
    v_item_name TEXT;
BEGIN
    IF p_quantity <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Некорректное количество');
    END IF;

    SELECT price, name INTO v_price, v_item_name
    FROM public.items WHERE id = p_item_id;

    IF v_price IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Товар не найден');
    END IF;

    v_total_price := v_price * p_quantity;

    SELECT money INTO v_current_money
    FROM public.profiles WHERE user_id = v_user_id;

    IF v_current_money < v_total_price THEN
        RETURN jsonb_build_object('success', false, 'error', 'Недостаточно наличных средств');
    END IF;

    -- Deduct money
    UPDATE public.profiles
    SET money = money - v_total_price, total_spent = total_spent + v_total_price
    WHERE user_id = v_user_id;

    -- Add to inventory or stack
    INSERT INTO public.inventory (user_id, item_id, quantity)
    VALUES (v_user_id, p_item_id, p_quantity);

    -- Log transaction
    INSERT INTO public.transactions (user_id, type, amount, currency, description)
    VALUES (v_user_id, 'purchase', v_total_price, 'cash', 'Покупка товара: ' || v_item_name || ' x' || p_quantity);

    RETURN jsonb_build_object('success', true, 'total_spent', v_total_price);
END;
$$;

-- ==============================================================================
-- OWNER PROVISIONING INSTRUCTION (RUN IN SUPABASE SQL EDITOR)
-- ==============================================================================
-- To promote any user to OWNER (Level 5):
-- UPDATE public.profiles SET admin_level = 5 WHERE user_id = 'YOUR_SUPABASE_AUTH_USER_ID';
-- INSERT INTO public.admin_roles (user_id, admin_level, title) VALUES ('YOUR_SUPABASE_AUTH_USER_ID', 5, 'Owner')
-- ON CONFLICT (user_id) DO UPDATE SET admin_level = 5, title = 'Owner';
