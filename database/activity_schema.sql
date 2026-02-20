-- ========================================
-- Discord Activity 日誌系統 - Supabase Schema
-- ========================================

-- 1. Activity 日誌表
-- 記錄所有 Activity 事件
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    channel_id VARCHAR(50),
    guild_id VARCHAR(50),
    user_id VARCHAR(50),
    username VARCHAR(100),
    message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_channel_id ON activity_logs(channel_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_guild_id ON activity_logs(guild_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- 2. Activity Session 統計表
-- 記錄每次 Activity 使用的統計數據
CREATE TABLE IF NOT EXISTS activity_sessions (
    id BIGSERIAL PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL,
    guild_id VARCHAR(50),
    host_user_id VARCHAR(50),
    host_username VARCHAR(100),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    peak_players INTEGER DEFAULT 0,
    total_joins INTEGER DEFAULT 0,
    total_leaves INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    games_data JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_activity_sessions_guild_id ON activity_sessions(guild_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_start_time ON activity_sessions(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_host_user_id ON activity_sessions(host_user_id);

-- 3. 遊戲統計表
-- 記錄每場遊戲的詳細統計
CREATE TABLE IF NOT EXISTS game_stats (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES activity_sessions(id),
    channel_id VARCHAR(50),
    guild_id VARCHAR(50),
    game_id VARCHAR(50) NOT NULL,
    game_name VARCHAR(100),
    player_count INTEGER DEFAULT 0,
    winner VARCHAR(50),
    duration_seconds INTEGER DEFAULT 0,
    game_data JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_game_stats_game_id ON game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_guild_id ON game_stats(guild_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_started_at ON game_stats(started_at DESC);

-- 4. 玩家參與記錄表
-- 記錄玩家的參與情況
CREATE TABLE IF NOT EXISTS player_activity (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    username VARCHAR(100),
    guild_id VARCHAR(50),
    session_count INTEGER DEFAULT 0,
    total_play_time INTEGER DEFAULT 0, -- 秒數
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    last_played_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, guild_id)
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_player_activity_user_id ON player_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_player_activity_guild_id ON player_activity(guild_id);

-- ========================================
-- 輔助函數
-- ========================================

-- 更新 player_activity 統計的函數
CREATE OR REPLACE FUNCTION update_player_stats(
    p_user_id VARCHAR(50),
    p_username VARCHAR(100),
    p_guild_id VARCHAR(50),
    p_play_time INTEGER,
    p_games INTEGER,
    p_wins INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO player_activity (user_id, username, guild_id, session_count, total_play_time, games_played, games_won, last_played_at)
    VALUES (p_user_id, p_username, p_guild_id, 1, p_play_time, p_games, p_wins, NOW())
    ON CONFLICT (user_id, guild_id)
    DO UPDATE SET
        username = p_username,
        session_count = player_activity.session_count + 1,
        total_play_time = player_activity.total_play_time + p_play_time,
        games_played = player_activity.games_played + p_games,
        games_won = player_activity.games_won + p_wins,
        last_played_at = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- RLS 政策 (Row Level Security)
-- ========================================

-- 啟用 RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_activity ENABLE ROW LEVEL SECURITY;

-- 允許 service role 完全訪問
CREATE POLICY "Service role full access to activity_logs" 
    ON activity_logs FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to activity_sessions" 
    ON activity_sessions FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to game_stats" 
    ON game_stats FOR ALL 
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to player_activity" 
    ON player_activity FOR ALL 
    USING (auth.role() = 'service_role');

-- ========================================
-- 統計視圖
-- ========================================

-- 每日統計視圖
CREATE OR REPLACE VIEW daily_activity_stats AS
SELECT 
    DATE(start_time AT TIME ZONE 'Asia/Hong_Kong') AS date,
    COUNT(*) AS session_count,
    SUM(duration_seconds) AS total_duration,
    SUM(games_played) AS total_games,
    MAX(peak_players) AS max_players,
    AVG(peak_players)::NUMERIC(10,1) AS avg_players
FROM activity_sessions
GROUP BY DATE(start_time AT TIME ZONE 'Asia/Hong_Kong')
ORDER BY date DESC;

-- 遊戲排行視圖
CREATE OR REPLACE VIEW game_leaderboard AS
SELECT 
    game_id,
    game_name,
    COUNT(*) AS times_played,
    SUM(duration_seconds) AS total_play_time,
    AVG(player_count)::NUMERIC(10,1) AS avg_players
FROM game_stats
GROUP BY game_id, game_name
ORDER BY times_played DESC;

-- 玩家排行視圖
CREATE OR REPLACE VIEW player_leaderboard AS
SELECT 
    user_id,
    username,
    SUM(session_count) AS total_sessions,
    SUM(total_play_time) AS total_play_time,
    SUM(games_played) AS total_games,
    SUM(games_won) AS total_wins,
    CASE WHEN SUM(games_played) > 0 
        THEN (SUM(games_won)::FLOAT / SUM(games_played) * 100)::NUMERIC(10,1)
        ELSE 0 
    END AS win_rate
FROM player_activity
GROUP BY user_id, username
ORDER BY total_games DESC;

-- ========================================
-- 範例查詢
-- ========================================

-- 查看最近 7 天的統計
-- SELECT * FROM daily_activity_stats WHERE date >= CURRENT_DATE - INTERVAL '7 days';

-- 查看最熱門的遊戲
-- SELECT * FROM game_leaderboard LIMIT 10;

-- 查看活躍玩家排行
-- SELECT * FROM player_leaderboard LIMIT 20;

-- 查看特定伺服器的統計
-- SELECT * FROM activity_sessions WHERE guild_id = 'YOUR_GUILD_ID' ORDER BY start_time DESC LIMIT 10;
