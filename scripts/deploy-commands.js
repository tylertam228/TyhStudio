/**
 * Deploy Slash Commands
 * Usage:
 *   node scripts/deploy-commands.js          → deploy to test guild (fast)
 *   node scripts/deploy-commands.js --global → deploy globally (takes up to 1 hour)
 */

require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const isGlobal = process.argv.includes('--global');
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
    console.log(`\nDeploying ${commands.length} commands ${isGlobal ? '(GLOBAL)' : '(GUILD)'}...\n`);
    
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);
    
    try {
        if (isGlobal) {
            const existing = await rest.get(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID));
            const entryPoints = existing.filter(cmd => cmd.type === 4);
            if (entryPoints.length > 0) {
                console.log(`  ↳ Preserving ${entryPoints.length} Entry Point command(s)`);
            }
            const allCommands = [...commands, ...entryPoints];

            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: allCommands }
            );
            console.log('✅ Successfully deployed globally (may take up to 1 hour to propagate)');
        } else if (process.env.DISCORD_GUILD_ID) {
            const guildIds = process.env.DISCORD_GUILD_ID.split(',').map(id => id.trim()).filter(Boolean);
            for (const guildId of guildIds) {
                await rest.put(
                    Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId),
                    { body: commands }
                );
                console.log(`✅ Deployed to guild: ${guildId}`);
            }
            console.log('\nTip: use --global flag to deploy to all servers');
        } else {
            await rest.put(
                Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
                { body: commands }
            );
            console.log('✅ No DISCORD_GUILD_ID set, deployed globally');
        }
    } catch (error) {
        console.error('Failed to deploy commands:', error);
    }
}

deployCommands();
