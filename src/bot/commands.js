/**
 * Command Loader
 * Loads all commands from feature directories
 */

const fs = require('fs');
const path = require('path');

async function loadCommands(client) {
    console.log('Loading commands...');
    
    const featuresPath = path.join(__dirname, 'features');
    let commandCount = 0;
    
    if (!fs.existsSync(featuresPath)) {
        console.log('No features directory found');
        return;
    }
    
    const features = fs.readdirSync(featuresPath).filter(item => {
        const itemPath = path.join(featuresPath, item);
        return fs.statSync(itemPath).isDirectory();
    });
    
    for (const feature of features) {
        const commandPath = path.join(featuresPath, feature, 'command.js');
        
        if (fs.existsSync(commandPath)) {
            const command = require(commandPath);
            
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
                console.log(`  Loaded: /${command.data.name}`);
                commandCount++;
            }
        }
    }
    
    console.log(`Loaded ${commandCount} commands`);
}

module.exports = { loadCommands };
