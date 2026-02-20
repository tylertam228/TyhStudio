/**
 * Ready Event - Bot startup with rotating funny status
 */

const { initLogger } = require('../../services/logger');
const { ActivityType } = require('discord.js');

// Fun rotating activities
const activities = [
    { type: ActivityType.Playing, text: '和老虎玩躲貓貓 🐯' },
    { type: ActivityType.Playing, text: '一夜狼人殺' },
    { type: ActivityType.Playing, text: '假裝自己很聰明' },
    { type: ActivityType.Watching, text: '你的每一個動作 👀' },
    { type: ActivityType.Watching, text: '老虎睡覺中...' },
    { type: ActivityType.Watching, text: 'Netflix 但不 Chill' },
    { type: ActivityType.Listening, text: '你的心跳聲 ❤️' },
    { type: ActivityType.Listening, text: 'Lo-Fi Beats' },
    { type: ActivityType.Listening, text: '老闆的碎碎念' },
    { type: ActivityType.Competing, text: '誰最會摸魚比賽' },
    { type: ActivityType.Competing, text: '拖延症錦標賽' },
    { type: ActivityType.Playing, text: '/help 獲取幫助' },
    { type: ActivityType.Watching, text: `${new Date().getFullYear()} 繼續努力!` },
    { type: ActivityType.Playing, text: '今天吃什麼？' },
    { type: ActivityType.Listening, text: '你的願望 ⭐' },
    { type: ActivityType.Playing, text: 'Bug 捉迷藏' },
    { type: ActivityType.Watching, text: '程式碼自己跑' },
    { type: ActivityType.Playing, text: '和 AI 聊天' },
    { type: ActivityType.Competing, text: '最佳擺爛獎' },
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
        
        // Rotate activity every 5 minutes
        setInterval(() => rotateActivity(client), 5 * 60 * 1000);
        
        // Initialize logger
        await initLogger(client);
    }
};
