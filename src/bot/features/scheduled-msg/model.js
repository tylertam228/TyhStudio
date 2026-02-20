/**
 * Scheduled Message Model
 */

const { getSupabase } = require('../../../database/supabase');

const TABLE_NAME = 'scheduled_messages';

const SCHEDULE_TYPES = ['once', 'daily', 'weekly', 'monthly', 'custom'];

async function createScheduledMessage(data) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    const { data: message, error } = await supabase
        .from(TABLE_NAME)
        .insert({
            user_id: data.userId,
            guild_id: data.guildId,
            channel_id: data.channelId,
            target_user_id: data.targetUserId,
            message_content: data.messageContent,
            schedule_type: data.scheduleType,
            cron_expression: data.cronExpression,
            next_run_at: data.nextRunAt,
            max_runs: data.maxRuns,
        })
        .select()
        .single();

    if (error) throw error;
    return message;
}

async function getScheduledMessagesByUser(userId, options = {}) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    let query = supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', userId);

    if (options.isActive !== undefined) {
        query = query.eq('is_active', options.isActive);
    }

    query = query.order('next_run_at', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;
    return data;
}

async function getPendingMessages() {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('is_active', true)
        .lte('next_run_at', now);

    if (error) throw error;
    return data;
}

function calculateNextRunTime(scheduleType, currentTime = new Date()) {
    const next = new Date(currentTime);

    switch (scheduleType) {
        case 'daily':
            next.setDate(next.getDate() + 1);
            break;
        case 'weekly':
            next.setDate(next.getDate() + 7);
            break;
        case 'monthly':
            next.setMonth(next.getMonth() + 1);
            break;
        case 'once':
            return null;
        default:
            return null;
    }

    return next.toISOString();
}

async function updateAfterExecution(id, scheduleType) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    const { data: current, error: getError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('id', id)
        .single();

    if (getError) throw getError;

    const nextRunAt = calculateNextRunTime(scheduleType);
    const newRunCount = current.run_count + 1;
    
    const shouldDeactivate = 
        scheduleType === 'once' || 
        (current.max_runs && newRunCount >= current.max_runs);

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
            last_run_at: new Date().toISOString(),
            next_run_at: nextRunAt,
            run_count: newRunCount,
            is_active: !shouldDeactivate,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function toggleActive(id) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    const { data: current, error: getError } = await supabase
        .from(TABLE_NAME)
        .select('is_active')
        .eq('id', id)
        .single();

    if (getError) throw getError;

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ is_active: !current.is_active })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function updateScheduledMessage(id, updates) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

async function deleteScheduledMessage(id) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Database not connected');

    const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
}

module.exports = {
    createScheduledMessage,
    getScheduledMessagesByUser,
    getPendingMessages,
    calculateNextRunTime,
    updateAfterExecution,
    toggleActive,
    updateScheduledMessage,
    deleteScheduledMessage,
    SCHEDULE_TYPES,
};
