/**
 * Event Loader
 */

const fs = require('fs');
const path = require('path');

async function loadEvents(client) {
    console.log('Loading events...');
    
    const eventsPath = __dirname;
    const eventFiles = fs.readdirSync(eventsPath).filter(file => 
        file.endsWith('.js') && file !== 'index.js'
    );
    
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        
        console.log(`  Loaded event: ${event.name}`);
    }
    
    console.log(`Loaded ${eventFiles.length} events`);
}

module.exports = { loadEvents };
