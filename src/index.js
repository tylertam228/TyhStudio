require('dotenv').config();

const { startBot } = require('./bot/client');
const { startWebServer } = require('./web/server');

async function main() {
    console.log('Starting Studio...');
    
    try {
        // Start Discord Bot
        await startBot();
        
        // Start Web Server
        await startWebServer();
        
        console.log('All systems running!');
    } catch (error) {
        console.error('Failed to start:', error);
        process.exit(1);
    }
}

main();