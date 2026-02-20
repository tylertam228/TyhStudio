/**
 * Scheduled Message Command
 */

const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ChannelType,
} = require('discord.js');
const scheduledMessageModel = require('./model');

const TYPE_LABELS = {
    once: '單次',
    daily: '每日',
    weekly: '每週',
    monthly: '每月',
    custom: '自訂',
};

const TYPE_EMOJI = {
    once: '1',
    daily: 'D',
    weekly: 'W',
    monthly: 'M',
    custom: 'C',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule-msg')
        .setDescription('⏰ 排程訊息系統')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('➕ 新增排程訊息')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('訊息內容')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('排程類型')
                        .setRequired(true)
                        .addChoices(
                            { name: '1️⃣ 單次', value: 'once' },
                            { name: '📆 每日', value: 'daily' },
                            { name: '📅 每週', value: 'weekly' },
                            { name: '🗓️ 每月', value: 'monthly' }
                        ))
                .addStringOption(option =>
                    option.setName('datetime')
                        .setDescription('執行時間 (格式: YYYY-MM-DD HH:mm)')
                        .setRequired(true))
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('發送頻道 (不填則發送 DM)')
                        .setRequired(false)
                        .addChannelTypes(ChannelType.GuildText))
                .addUserOption(option =>
                    option.setName('target_user')
                        .setDescription('發送給特定用戶 (DM)')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('max_runs')
                        .setDescription('最大執行次數 (不填則無限制)')
                        .setRequired(false)
                        .setMinValue(1)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('📋 查看我的排程訊息')
                .addBooleanOption(option =>
                    option.setName('show_inactive')
                        .setDescription('顯示已停用的排程')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('toggle')
                .setDescription('🔄 啟用/停用排程')
                .addStringOption(option =>
                    option.setName('schedule_id')
                        .setDescription('排程 ID')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('🗑️ 刪除排程訊息')
                .addStringOption(option =>
                    option.setName('schedule_id')
                        .setDescription('排程 ID')
                        .setRequired(true)
                        .setAutocomplete(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('🔍 查看排程詳細資訊')
                .addStringOption(option =>
                    option.setName('schedule_id')
                        .setDescription('排程 ID')
                        .setRequired(true)
                        .setAutocomplete(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'add':
                await handleAdd(interaction);
                break;
            case 'list':
                await handleList(interaction);
                break;
            case 'toggle':
                await handleToggle(interaction);
                break;
            case 'delete':
                await handleDelete(interaction);
                break;
            case 'view':
                await handleView(interaction);
                break;
        }
    },

    async handleAutocomplete(interaction) {
        const focusedOption = interaction.options.getFocused(true);
        const focusedValue = focusedOption.value.toLowerCase();

        if (focusedOption.name === 'schedule_id') {
            const schedules = await scheduledMessageModel.getScheduledMessagesByUser(interaction.user.id, {});
            const choices = schedules
                .filter(s => 
                    s.id.toLowerCase().includes(focusedValue) || 
                    s.message_content.toLowerCase().includes(focusedValue)
                )
                .slice(0, 25)
                .map(s => ({
                    name: `${s.message_content.slice(0, 40)}${s.message_content.length > 40 ? '...' : ''} (${s.id.slice(0, 8)})`,
                    value: s.id.slice(0, 8),
                }));
            await interaction.respond(choices);
        }
    },

    async handleButton(interaction) {
        const parts = interaction.customId.split('_');
        const action = parts[1];
        const scheduleId = parts[2];

        const schedules = await scheduledMessageModel.getScheduledMessagesByUser(interaction.user.id, {});
        const schedule = schedules.find(s => s.id === scheduleId);

        if (!schedule) {
            return interaction.reply({ content: '找不到排程', ephemeral: true });
        }

        if (action === 'toggle') {
            const updated = await scheduledMessageModel.toggleActive(scheduleId);
            const statusStr = updated.is_active ? '✅ 已啟用' : '⏸️ 已停用';
            await interaction.reply({ content: `${statusStr} 排程`, ephemeral: true });
        } else if (action === 'delete') {
            await scheduledMessageModel.deleteScheduledMessage(scheduleId);
            await interaction.update({ content: '已刪除排程', embeds: [], components: [] });
        }
    },
};

async function handleAdd(interaction) {
    const message = interaction.options.getString('message');
    const scheduleType = interaction.options.getString('type');
    const datetimeStr = interaction.options.getString('datetime');
    const channel = interaction.options.getChannel('channel');
    const targetUser = interaction.options.getUser('target_user');
    const maxRuns = interaction.options.getInteger('max_runs');

    const nextRunAt = parseDateTime(datetimeStr);
    if (!nextRunAt) {
        return interaction.reply({ content: '格式無效，請使用 YYYY-MM-DD HH:mm', ephemeral: true });
    }

    if (nextRunAt <= new Date()) {
        return interaction.reply({ content: '時間必須在未來', ephemeral: true });
    }

    if (!channel && !targetUser) {
        return interaction.reply({ content: '請指定頻道或目標用戶', ephemeral: true });
    }

    try {
        const scheduled = await scheduledMessageModel.createScheduledMessage({
            userId: interaction.user.id,
            guildId: interaction.guildId,
            channelId: channel?.id,
            targetUserId: targetUser?.id,
            messageContent: message,
            scheduleType,
            nextRunAt: nextRunAt.toISOString(),
            maxRuns,
        });

        const embed = new EmbedBuilder()
            .setTitle('⏰ 排程已建立')
            .setColor(0x9B59B6)
            .addFields(
                { name: '📝 訊息', value: message.length > 100 ? message.slice(0, 100) + '...' : message },
                { name: '📋 類型', value: `[${TYPE_EMOJI[scheduleType]}] ${TYPE_LABELS[scheduleType]}`, inline: true },
                { name: '⏰ 下次執行', value: `<t:${Math.floor(nextRunAt.getTime() / 1000)}:F>`, inline: true },
            );

        if (channel) {
            embed.addFields({ name: '📍 頻道', value: `<#${channel.id}>`, inline: true });
        }

        if (targetUser) {
            embed.addFields({ name: '👤 目標', value: `<@${targetUser.id}>`, inline: true });
        }

        if (maxRuns) {
            embed.addFields({ name: '🔢 最大次數', value: `${maxRuns}`, inline: true });
        }

        embed.setFooter({ text: `ID: ${scheduled.id.slice(0, 8)}` });
        embed.setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`schedule-msg_toggle_${scheduled.id}`)
                    .setLabel('停用')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`schedule-msg_delete_${scheduled.id}`)
                    .setLabel('刪除')
                    .setStyle(ButtonStyle.Danger),
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    } catch (error) {
        console.error('Error creating scheduled message:', error);
        await interaction.reply({ content: '建立排程時發生錯誤', ephemeral: true });
    }
}

async function handleList(interaction) {
    const showInactive = interaction.options.getBoolean('show_inactive') ?? false;

    try {
        const options = {};
        if (!showInactive) options.isActive = true;

        const schedules = await scheduledMessageModel.getScheduledMessagesByUser(interaction.user.id, options);

        if (schedules.length === 0) {
            return interaction.reply({ content: '找不到排程訊息', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('📋 排程訊息')
            .setColor(0x9B59B6)
            .setTimestamp();

        const description = schedules.slice(0, 10).map((s) => {
            const activeIcon = s.is_active ? '✅' : '⏸️';
            const typeIcon = TYPE_EMOJI[s.schedule_type];
            const msgPreview = s.message_content.length > 30 
                ? s.message_content.slice(0, 30) + '...' 
                : s.message_content;
            const nextRunStr = s.next_run_at 
                ? `<t:${Math.floor(new Date(s.next_run_at).getTime() / 1000)}:R>`
                : '已完成';
            return `${activeIcon} [${typeIcon}] **${msgPreview}**\n  下次: ${nextRunStr} | 已執行: ${s.run_count}次 | ID: \`${s.id.slice(0, 8)}\``;
        }).join('\n\n');

        embed.setDescription(description);

        if (schedules.length > 10) {
            embed.setFooter({ text: `顯示 10/${schedules.length}` });
        } else {
            embed.setFooter({ text: `共 ${schedules.length} 個` });
        }

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error listing scheduled messages:', error);
        await interaction.reply({ content: '取得排程時發生錯誤', ephemeral: true });
    }
}

async function handleToggle(interaction) {
    const scheduleId = interaction.options.getString('schedule_id');

    try {
        const schedules = await scheduledMessageModel.getScheduledMessagesByUser(interaction.user.id, {});
        const schedule = schedules.find(s => s.id.startsWith(scheduleId));

        if (!schedule) {
            return interaction.reply({ content: '找不到排程', ephemeral: true });
        }

        const updated = await scheduledMessageModel.toggleActive(schedule.id);
        const statusStr = updated.is_active ? '✅ 已啟用' : '⏸️ 已停用';

        await interaction.reply({ content: `${statusStr} 排程 \`${schedule.id.slice(0, 8)}\``, ephemeral: true });
    } catch (error) {
        console.error('Error toggling schedule:', error);
        await interaction.reply({ content: '切換排程時發生錯誤', ephemeral: true });
    }
}

async function handleDelete(interaction) {
    const scheduleId = interaction.options.getString('schedule_id');

    try {
        const schedules = await scheduledMessageModel.getScheduledMessagesByUser(interaction.user.id, {});
        const schedule = schedules.find(s => s.id.startsWith(scheduleId));

        if (!schedule) {
            return interaction.reply({ content: '找不到排程', ephemeral: true });
        }

        await scheduledMessageModel.deleteScheduledMessage(schedule.id);
        await interaction.reply({ content: `已刪除排程 \`${schedule.id.slice(0, 8)}\``, ephemeral: true });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        await interaction.reply({ content: '刪除排程時發生錯誤', ephemeral: true });
    }
}

async function handleView(interaction) {
    const scheduleId = interaction.options.getString('schedule_id');

    try {
        const schedules = await scheduledMessageModel.getScheduledMessagesByUser(interaction.user.id, {});
        const schedule = schedules.find(s => s.id.startsWith(scheduleId));

        if (!schedule) {
            return interaction.reply({ content: '找不到排程', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('📋 排程詳情')
            .setColor(schedule.is_active ? 0x2ECC71 : 0xE74C3C)
            .addFields(
                { name: '📝 訊息', value: schedule.message_content },
                { name: '📋 類型', value: `[${TYPE_EMOJI[schedule.schedule_type]}] ${TYPE_LABELS[schedule.schedule_type]}`, inline: true },
                { name: '🔌 狀態', value: schedule.is_active ? '✅ 啟用中' : '⏸️ 已停用', inline: true },
                { name: '🔢 已執行', value: `${schedule.run_count} 次`, inline: true },
            );

        if (schedule.next_run_at) {
            embed.addFields({ 
                name: '⏰ 下次執行', 
                value: `<t:${Math.floor(new Date(schedule.next_run_at).getTime() / 1000)}:F>`,
                inline: true,
            });
        }

        if (schedule.last_run_at) {
            embed.addFields({ 
                name: '⏱️ 上次執行', 
                value: `<t:${Math.floor(new Date(schedule.last_run_at).getTime() / 1000)}:F>`,
                inline: true,
            });
        }

        if (schedule.max_runs) {
            embed.addFields({ name: '🔢 最大次數', value: `${schedule.max_runs}`, inline: true });
        }

        if (schedule.channel_id) {
            embed.addFields({ name: '📍 頻道', value: `<#${schedule.channel_id}>`, inline: true });
        }

        if (schedule.target_user_id) {
            embed.addFields({ name: '👤 目標', value: `<@${schedule.target_user_id}>`, inline: true });
        }

        embed.setFooter({ text: `ID: ${schedule.id}` });
        embed.setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error viewing schedule:', error);
        await interaction.reply({ content: '查看排程時發生錯誤', ephemeral: true });
    }
}

function parseDateTime(str) {
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})$/);
    if (match) {
        return new Date(
            parseInt(match[1]),
            parseInt(match[2]) - 1,
            parseInt(match[3]),
            parseInt(match[4]),
            parseInt(match[5])
        );
    }
    return null;
}
