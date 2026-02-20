/**
 * Deploy Slash Commands
 * Usage: node scripts/deploy-commands.js
 */

require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const featuresPath = path.join(__dirname, '../src/bot/features');

function loadCommandsFromFeatures() {
    if (!fs.existsSync(featuresPath)) {
        console.log('No features directory found');
        return;
    }
    
    const features = fs.readdirSync(featuresPath);
    
    for (const feature of features) {
        const commandPath = path.join(featuresPath, feature, 'command.js');
        
        if (fs.existsSync(commandPath)) {
            const command = require(commandPath);
            if ('data' in command) {
                commands.push(command.data.toJSON());
                console.log(`  + ${command.data.name}`);
            }
        }
    }
}

async function deployCommands() {
    console.log('Loading commands...');
    loadCommandsFromFeatures();
    console.log(`\nDeploying ${commands.length} commands...`);
    
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    try {
        if (process.env.DISCORD_GUILD_ID) {
            await rest.put(
                Routes.applicationGuildCommands(
                    process.env.DISCORD_CLIENT_ID, 
                    process.env.DISCORD_GUILD_ID
                ),
                { body: commands }
            );
            console.log(`Successfully deployed to guild: ${process.env.DISCORD_GUILD_ID}`);
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commands }
            );
            console.log('Successfully deployed globally (may take up to 1 hour)');
        }
    } catch (error) {
        console.error('Failed to deploy commands:', error);
    }
}

deployCommands();
