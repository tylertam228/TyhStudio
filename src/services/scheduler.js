/**
 * Scheduler Service
 * Background task scheduler
 */

const { logScheduledTask, logError } = require('./logger');

const INTERVALS = {
    SCHEDULE_CHECK: 60 * 1000,
};

let client = null;
let intervals = [];

function startScheduler(discordClient) {
    client = discordClient;
    console.log('Starting background scheduler...');

    const fs = require('fs');
    const path = require('path');
    const featuresPath = path.join(__dirname, '..', 'bot', 'features');
    
    if (fs.existsSync(featuresPath)) {
        const features = fs.readdirSync(featuresPath);
        
        for (const feature of features) {
            const schedulerPath = path.join(featuresPath, feature, 'scheduler.js');
            if (fs.existsSync(schedulerPath)) {
                try {
                    const featureScheduler = require(schedulerPath);
                    if (featureScheduler.register) {
                        featureScheduler.register(client, intervals);
                    }
                } catch (err) {
                    console.error(`Failed to load scheduler for ${feature}:`, err);
                }
            }
        }
    }

    console.log('Background scheduler started');
    
    logScheduledTask('Scheduler Started', `Registered ${intervals.length} tasks`).catch(err => console.error('Log error:', err));
}

function stopScheduler() {
    console.log('Stopping background scheduler...');
    intervals.forEach(interval => clearInterval(interval));
    intervals = [];
}

module.exports = {
    startScheduler,
    stopScheduler,
    INTERVALS,
};
