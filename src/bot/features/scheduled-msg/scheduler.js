/**
 * Scheduled Message Scheduler
 */

const scheduledMessageModel = require('./model');

const SCHEDULE_CHECK_INTERVAL = 60 * 1000; // 1 minute

function register(client, intervals) {
    intervals.push(setInterval(() => checkScheduledMessages(client), SCHEDULE_CHECK_INTERVAL));
    
    setTimeout(() => checkScheduledMessages(client), 10000);
}

async function checkScheduledMessages(client) {
    if (!client) return;

    try {
        const pending = await scheduledMessageModel.getPendingMessages();

        for (const message of pending) {
            await sendScheduledMessage(client, message);
            await scheduledMessageModel.updateAfterExecution(message.id, message.schedule_type);
        }
    } catch (error) {
        console.error('Error in scheduled messages:', error);
    }
}

async function sendScheduledMessage(client, scheduled) {
    try {
        if (scheduled.channel_id) {
            const channel = await client.channels.fetch(scheduled.channel_id);
            if (channel) {
                await channel.send(scheduled.message_content);
            }
        }

        if (scheduled.target_user_id) {
            const user = await client.users.fetch(scheduled.target_user_id);
            if (user) {
                await user.send(scheduled.message_content);
            }
        }
    } catch (error) {
        console.error(`Error sending scheduled message ${scheduled.id}:`, error);
    }
}

module.exports = {
    register,
    checkScheduledMessages,
};
