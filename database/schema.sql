-- Tiger-228 Discord Bot Database Schema
-- Supabase PostgreSQL Schema
-- 建立於: 2024

-- =====================================================
-- 生活模組 (Lifestyle Module)
-- =====================================================

-- 餐廳清單（群組共享）
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cuisine_type VARCHAR(100),
    location VARCHAR(255),
    price_range VARCHAR(20) CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    notes TEXT,
    is_favorite BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurants_guild_id ON restaurants(guild_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_user_id ON restaurants(user_id);

-- =====================================================
-- 排程訊息
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    guild_id VARCHAR(255),
    channel_id VARCHAR(255),
    target_user_id VARCHAR(255),
    message_content TEXT NOT NULL,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('once', 'daily', 'weekly', 'monthly', 'custom')),
    cron_expression VARCHAR(100),
    next_run_at TIMESTAMPTZ NOT NULL,
    last_run_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    run_count INTEGER DEFAULT 0,
    max_runs INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user_id ON scheduled_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_next_run ON scheduled_messages(next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_active ON scheduled_messages(is_active);

-- =====================================================
-- 用戶設定
-- =====================================================
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    timezone VARCHAR(50) DEFAULT 'Asia/Taipei',
    language VARCHAR(10) DEFAULT 'zh-TW',
    dm_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- =====================================================
-- 更新時間觸發器
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('restaurants', 'scheduled_messages', 'user_settings')
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;
