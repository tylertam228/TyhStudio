/**
 * Ping Command
 */

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('🏓 檢查機器人延遲'),
    
    async execute(interaction) {
        const sent = await interaction.reply({ 
            content: '🏓 檢測中...', 
            fetchReply: true,
            ephemeral: true
        });
        
        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const websocket = interaction.client.ws.ping;
        
        await interaction.editReply(
            `🏓 **Pong!**\n` +
            `📡 延遲: \`${roundtrip}ms\`\n` +
            `💓 WebSocket: \`${websocket}ms\``
        );
    }
};
