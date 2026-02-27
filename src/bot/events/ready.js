/**
 * Ready Event - Bot startup with rotating funny status
 */

const { initLogger } = require('../../services/logger');
const { ActivityType } = require('discord.js');

// Fun rotating activities
const activities = [
    { type: ActivityType.Watching, text: '老虎睡覺中...' },
    { type: ActivityType.Watching, text: 'Netflix 但不 Chill' },
    { type: ActivityType.Competing, text: '驗腦啦！IQ排行榜98！' },
    { type: ActivityType.Playing, text: '/help 獲取幫助' },
    { type: ActivityType.Watching, text: `${new Date().getFullYear()} 繼續努力!` },
    { type: ActivityType.Playing, text: '今天吃什麼？' },
    { type: ActivityType.Playing, text: 'tyhstudio.com' },
];

let activityIndex = 0;

function rotateActivity(client) {
    const activity = activities[activityIndex];
    client.user.setActivity(activity.text, { type: activity.type });
    
    // Move to next activity (loop back to start)
    activityIndex = (activityIndex + 1) % activities.length;
}

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        console.log(`Bot is online as ${client.user.tag}!`);
        console.log(`Serving ${client.guilds.cache.size} server(s)`);
        
        // Set initial random activity
        activityIndex = Math.floor(Math.random() * activities.length);
        rotateActivity(client);
        
        // Rotate activity every 45 seconds
        setInterval(() => rotateActivity(client), 45 * 1000);
        
        // Initialize logger
        await initLogger(client);
    }
};
