/**
 * Activity Logger Service
 * 記錄 Discord Activity 的使用情況
 * - 開始時間
 * - 玩家加入/離開
 * - 遊戲選擇與結束
 * - 統計數據保存至 Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Supabase 設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

/**
 * 初始化 Supabase 客戶端
 */
function getSupabase() {
    if (!supabase && supabaseUrl && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey);
        console.log('📊 Activity Logger: Supabase 已連接');
    }
    return supabase;
}

/**
 * 日誌類型
 */
const LogType = {
    SESSION_START: 'session_start',
    SESSION_END: 'session_end',
    PLAYER_JOIN: 'player_join',
    PLAYER_LEAVE: 'player_leave',
    GAME_START: 'game_start',
    GAME_END: 'game_end',
    ERROR: 'error',
};

/**
 * 本地日誌緩存（用於無 Supabase 時的備用）
 */
const localLogs = [];
const sessionStats = new Map(); // channelId -> stats

/**
 * 格式化香港時間
 */
function formatHKTime(date = new Date()) {
    return date.toLocaleString('zh-TW', {
        timeZone: 'Asia/Hong_Kong',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

/**
 * 記錄 Activity 開始
 */
async function logSessionStart(channelId, guildId, hostUserId, hostUsername) {
    const timestamp = new Date();
    
    // 初始化 session 統計
    sessionStats.set(channelId, {
        channelId,
        guildId,
        hostUserId,
        hostUsername,
        startTime: timestamp,
        endTime: null,
        peakPlayers: 1,
        totalJoins: 1,
        totalLeaves: 0,
        gamesPlayed: [],
        players: new Set([hostUserId]),
    });

    const logEntry = {
        type: LogType.SESSION_START,
        channel_id: channelId,
        guild_id: guildId,
        user_id: hostUserId,
        username: hostUsername,
        message: `Activity 已啟動 - 房主: ${hostUsername}`,
        metadata: { hostUserId, hostUsername },
        created_at: timestamp.toISOString(),
    };

    await saveLog(logEntry);
    console.log(`🎮 [${formatHKTime()}] Activity 啟動 - 頻道: ${channelId}, 房主: ${hostUsername}`);
    
    return logEntry;
}

/**
 * 記錄 Activity 結束
 */
async function logSessionEnd(channelId) {
    const timestamp = new Date();
    const stats = sessionStats.get(channelId);
    
    if (!stats) return null;

    stats.endTime = timestamp;
    const duration = Math.floor((timestamp - stats.startTime) / 1000); // 秒數

    const logEntry = {
        type: LogType.SESSION_END,
        channel_id: channelId,
        guild_id: stats.guildId,
        message: `Activity 已結束 - 持續時間: ${formatDuration(duration)}`,
        metadata: {
            duration,
            peakPlayers: stats.peakPlayers,
            totalJoins: stats.totalJoins,
            totalLeaves: stats.totalLeaves,
            gamesPlayed: stats.gamesPlayed,
        },
        created_at: timestamp.toISOString(),
    };

    await saveLog(logEntry);
    
    // 保存 session 統計到資料庫
    await saveSessionStats(stats);
    
    // 清理
    sessionStats.delete(channelId);
    
    console.log(`🔴 [${formatHKTime()}] Activity 結束 - 頻道: ${channelId}, 持續: ${formatDuration(duration)}`);
    
    return logEntry;
}

/**
 * 記錄玩家加入
 */
async function logPlayerJoin(channelId, userId, username) {
    const timestamp = new Date();
    const stats = sessionStats.get(channelId);
    
    if (stats) {
        stats.players.add(userId);
        stats.totalJoins++;
        stats.peakPlayers = Math.max(stats.peakPlayers, stats.players.size);
    }

    const logEntry = {
        type: LogType.PLAYER_JOIN,
        channel_id: channelId,
        user_id: userId,
        username: username,
        message: `${username} 加入了 Activity`,
        metadata: { currentPlayers: stats?.players.size || 1 },
        created_at: timestamp.toISOString(),
    };

    await saveLog(logEntry);
    console.log(`👋 [${formatHKTime()}] ${username} 加入 - 頻道: ${channelId}`);
    
    return logEntry;
}

/**
 * 記錄玩家離開
 */
async function logPlayerLeave(channelId, userId, username) {
    const timestamp = new Date();
    const stats = sessionStats.get(channelId);
    
    if (stats) {
        stats.players.delete(userId);
        stats.totalLeaves++;
    }

    const logEntry = {
        type: LogType.PLAYER_LEAVE,
        channel_id: channelId,
        user_id: userId,
        username: username,
        message: `${username} 離開了 Activity`,
        metadata: { remainingPlayers: stats?.players.size || 0 },
        created_at: timestamp.toISOString(),
    };

    await saveLog(logEntry);
    console.log(`👋 [${formatHKTime()}] ${username} 離開 - 頻道: ${channelId}`);
    
    return logEntry;
}

/**
 * 記錄遊戲開始
 */
async function logGameStart(channelId, gameId, gameName, playerCount) {
    const timestamp = new Date();
    const stats = sessionStats.get(channelId);
    
    if (stats) {
        stats.gamesPlayed.push({
            gameId,
            gameName,
            startTime: timestamp,
            playerCount,
        });
    }

    const logEntry = {
        type: LogType.GAME_START,
        channel_id: channelId,
        message: `遊戲開始: ${gameName}`,
        metadata: { gameId, gameName, playerCount },
        created_at: timestamp.toISOString(),
    };

    await saveLog(logEntry);
    console.log(`🎲 [${formatHKTime()}] 遊戲開始: ${gameName} - ${playerCount} 人 - 頻道: ${channelId}`);
    
    return logEntry;
}

/**
 * 記錄遊戲結束
 */
async function logGameEnd(channelId, gameId, gameName, winner, result) {
    const timestamp = new Date();
    const stats = sessionStats.get(channelId);
    
    // 更新遊戲統計
    if (stats && stats.gamesPlayed.length > 0) {
        const lastGame = stats.gamesPlayed[stats.gamesPlayed.length - 1];
        if (lastGame.gameId === gameId) {
            lastGame.endTime = timestamp;
            lastGame.winner = winner;
            lastGame.duration = Math.floor((timestamp - lastGame.startTime) / 1000);
        }
    }

    const logEntry = {
        type: LogType.GAME_END,
        channel_id: channelId,
        message: `遊戲結束: ${gameName} - 勝利: ${winner === 'village' ? '村莊陣營' : '狼人陣營'}`,
        metadata: { gameId, gameName, winner, result },
        created_at: timestamp.toISOString(),
    };

    await saveLog(logEntry);
    console.log(`🏆 [${formatHKTime()}] 遊戲結束: ${gameName} - 勝利: ${winner} - 頻道: ${channelId}`);
    
    return logEntry;
}

/**
 * 記錄錯誤
 */
async function logError(channelId, error, context = '') {
    const timestamp = new Date();

    const logEntry = {
        type: LogType.ERROR,
        channel_id: channelId,
        message: `錯誤: ${error.message || error}`,
        metadata: { 
            error: error.message || error,
            stack: error.stack,
            context,
        },
        created_at: timestamp.toISOString(),
    };

    await saveLog(logEntry);
    console.error(`❌ [${formatHKTime()}] 錯誤: ${error.message || error} - 頻道: ${channelId}`);
    
    return logEntry;
}

/**
 * 保存日誌到資料庫
 */
async function saveLog(logEntry) {
    const client = getSupabase();
    
    // 本地備份
    localLogs.push(logEntry);
    if (localLogs.length > 1000) {
        localLogs.shift(); // 保持最多 1000 條
    }

    if (!client) return;

    try {
        const { error } = await client
            .from('activity_logs')
            .insert([logEntry]);
        
        if (error) {
            console.error('保存日誌失敗:', error.message);
        }
    } catch (err) {
        console.error('保存日誌異常:', err.message);
    }
}

/**
 * 保存 Session 統計到資料庫
 */
async function saveSessionStats(stats) {
    const client = getSupabase();
    if (!client) return;

    const duration = stats.endTime 
        ? Math.floor((stats.endTime - stats.startTime) / 1000)
        : 0;

    const sessionData = {
        channel_id: stats.channelId,
        guild_id: stats.guildId,
        host_user_id: stats.hostUserId,
        host_username: stats.hostUsername,
        start_time: stats.startTime.toISOString(),
        end_time: stats.endTime?.toISOString(),
        duration_seconds: duration,
        peak_players: stats.peakPlayers,
        total_joins: stats.totalJoins,
        total_leaves: stats.totalLeaves,
        games_played: stats.gamesPlayed.length,
        games_data: JSON.stringify(stats.gamesPlayed),
    };

    try {
        const { error } = await client
            .from('activity_sessions')
            .insert([sessionData]);
        
        if (error) {
            console.error('保存 Session 統計失敗:', error.message);
        } else {
            console.log(`📊 Session 統計已保存 - 頻道: ${stats.channelId}`);
        }
    } catch (err) {
        console.error('保存 Session 統計異常:', err.message);
    }
}

/**
 * 獲取統計數據
 */
async function getStats(guildId = null, days = 30) {
    const client = getSupabase();
    if (!client) return { error: 'Supabase 未連接' };

    try {
        let query = client
            .from('activity_sessions')
            .select('*')
            .gte('start_time', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
            .order('start_time', { ascending: false });

        if (guildId) {
            query = query.eq('guild_id', guildId);
        }

        const { data, error } = await query;

        if (error) throw error;

        // 計算統計
        const totalSessions = data.length;
        const totalDuration = data.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
        const totalGames = data.reduce((sum, s) => sum + (s.games_played || 0), 0);
        const avgPlayers = data.reduce((sum, s) => sum + (s.peak_players || 0), 0) / (totalSessions || 1);

        return {
            totalSessions,
            totalDuration,
            totalDurationFormatted: formatDuration(totalDuration),
            totalGames,
            avgPeakPlayers: Math.round(avgPlayers * 10) / 10,
            recentSessions: data.slice(0, 10),
        };
    } catch (err) {
        return { error: err.message };
    }
}

/**
 * 格式化持續時間
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return `${hours}時${minutes}分${secs}秒`;
    } else if (minutes > 0) {
        return `${minutes}分${secs}秒`;
    } else {
        return `${secs}秒`;
    }
}

/**
 * 獲取本地日誌（用於調試）
 */
function getLocalLogs(limit = 100) {
    return localLogs.slice(-limit);
}

/**
 * 獲取當前活躍 session
 */
function getActiveSessions() {
    const sessions = [];
    sessionStats.forEach((stats, channelId) => {
        sessions.push({
            channelId,
            hostUsername: stats.hostUsername,
            playerCount: stats.players.size,
            gamesPlayed: stats.gamesPlayed.length,
            startTime: stats.startTime,
            duration: Math.floor((Date.now() - stats.startTime) / 1000),
        });
    });
    return sessions;
}

export {
    LogType,
    logSessionStart,
    logSessionEnd,
    logPlayerJoin,
    logPlayerLeave,
    logGameStart,
    logGameEnd,
    logError,
    getStats,
    getLocalLogs,
    getActiveSessions,
    formatDuration,
    formatHKTime,
};
