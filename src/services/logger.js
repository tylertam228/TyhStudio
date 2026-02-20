/**
 * Logger Service
 */

const { EmbedBuilder } = require('discord.js');
const { formatHKDateTime } = require('../utils/timezone');

const LOG_CHANNEL_ID = '1454621076574179418';

let client = null;
let logChannel = null;

async function initLogger(discordClient) {
    client = discordClient;
    
    try {
        logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
        console.log(`Log channel connected: #${logChannel.name}`);
        await logStartup();
    } catch (error) {
        console.error('Cannot connect to log channel:', error.message);
    }
}

async function logStartup() {
    if (!logChannel) return;

    const now = new Date();

    const embed = new EmbedBuilder()
        .setTitle('🐯 Bot 已啟動')
        .setColor(0x2ECC71)
        .addFields(
            { name: '🤖 Bot', value: client.user.tag, inline: true },
            { name: '📊 伺服器數量', value: `${client.guilds.cache.size}`, inline: true },
            { name: '👥 用戶數量', value: `${client.users.cache.size}`, inline: true },
            { name: '⚡ 指令數量', value: `${client.commands.size}`, inline: true },
            { name: '💻 Node.js', value: process.version, inline: true },
            { name: '📦 Discord.js', value: require('discord.js').version, inline: true },
        )
        .setTimestamp()
        .setFooter({ text: `🟢 系統運行中 | 香港時間: ${formatHKDateTime(now)}` });

    await logChannel.send({ embeds: [embed] });
}

async function logCommand(interaction) {
    if (!logChannel) return;

    const commandName = interaction.commandName;
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand(false);
    
    let fullCommand = `/${commandName}`;
    if (subcommandGroup) fullCommand += ` ${subcommandGroup}`;
    if (subcommand) fullCommand += ` ${subcommand}`;
    
    const now = new Date();

    const embed = new EmbedBuilder()
        .setTitle('⚡ 指令使用')
        .setColor(0x3498DB)
        .addFields(
            { name: '📝 指令', value: `\`${fullCommand}\``, inline: true },
            { name: '👤 用戶', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📍 頻道', value: interaction.channel ? `<#${interaction.channel.id}>` : '私訊', inline: true },
        )
        .setTimestamp()
        .setThumbnail(interaction.user.displayAvatarURL({ size: 64 }))
        .setFooter({ text: `香港時間: ${formatHKDateTime(now)}` });

    await logChannel.send({ embeds: [embed] });
}

async function logError(error, context = '') {
    if (!logChannel) {
        console.error('Logger Error:', error);
        return;
    }

    const now = new Date();

    const embed = new EmbedBuilder()
        .setTitle('❌ 發生錯誤')
        .setColor(0xE74C3C)
        .addFields({ name: '⚠️ 錯誤訊息', value: `\`\`\`${error.message || error}\`\`\`` });

    if (context) {
        embed.addFields({ name: '📍 位置', value: context });
    }

    if (error.stack) {
        const stack = error.stack.substring(0, 1000);
        embed.addFields({ name: '📋 堆疊追蹤', value: `\`\`\`${stack}\`\`\`` });
    }

    embed.setTimestamp();
    embed.setFooter({ text: `香港時間: ${formatHKDateTime(now)}` });

    await logChannel.send({ embeds: [embed] });
}

async function logInfo(title, description, fields = []) {
    if (!logChannel) return;

    const now = new Date();

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(0x9B59B6)
        .setDescription(description)
        .setTimestamp()
        .setFooter({ text: `香港時間: ${formatHKDateTime(now)}` });

    for (const field of fields) {
        embed.addFields(field);
    }

    await logChannel.send({ embeds: [embed] });
}

async function logButton(interaction) {
    if (!logChannel) return;

    const now = new Date();

    const embed = new EmbedBuilder()
        .setTitle('🔘 按鈕點擊')
        .setColor(0xF39C12)
        .addFields(
            { name: '🆔 按鈕 ID', value: `\`${interaction.customId}\``, inline: true },
            { name: '👤 用戶', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📍 頻道', value: interaction.channel ? `<#${interaction.channel.id}>` : '私訊', inline: true },
        )
        .setTimestamp()
        .setFooter({ text: `香港時間: ${formatHKDateTime(now)}` });

    await logChannel.send({ embeds: [embed] });
}

async function logScheduledTask(taskName, details = '') {
    if (!logChannel) return;

    const now = new Date();

    const embed = new EmbedBuilder()
        .setTitle('⏰ 排程任務')
        .setColor(0x1ABC9C)
        .addFields({ name: '📋 任務', value: taskName })
        .setTimestamp()
        .setFooter({ text: `香港時間: ${formatHKDateTime(now)}` });

    if (details) {
        embed.addFields({ name: '📝 詳細資訊', value: details });
    }

    await logChannel.send({ embeds: [embed] });
}

async function logShutdown() {
    if (!logChannel) return;

    const now = new Date();

    const embed = new EmbedBuilder()
        .setTitle('🔴 Bot 正在關閉...')
        .setColor(0xE74C3C)
        .setDescription('Bot 正在執行關閉程序')
        .setTimestamp()
        .setFooter({ text: `香港時間: ${formatHKDateTime(now)}` });

    await logChannel.send({ embeds: [embed] });
}

module.exports = {
    initLogger,
    logStartup,
    logCommand,
    logError,
    logInfo,
    logButton,
    logScheduledTask,
    logShutdown,
};
