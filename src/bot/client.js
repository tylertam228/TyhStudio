/**
 * Discord Bot Client
 */

const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { loadEvents } = require('./events/index');
const { loadCommands } = require('./commands');
const { startScheduler } = require('../services/scheduler');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();

async function startBot() {
    console.log('Initializing Discord Bot...');
    
    await loadCommands(client);
    await loadEvents(client);
    
    await client.login(process.env.DISCORD_TOKEN);
    
    client.once('ready', () => {
        startScheduler(client);
    });
    
    return client;
}

module.exports = { client, startBot };
