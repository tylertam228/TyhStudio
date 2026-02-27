const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const iqModel = require('./model');
const { ADMIN_DISCORD_ID } = require('./notifications');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('iq')
        .setDescription('🧠 IQ 排名系統')
        .addSubcommand(sub =>
            sub.setName('rank').setDescription('📊 查看目前排名'))
        .addSubcommand(sub =>
            sub.setName('history').setDescription('📈 查看個人排名歷史'))
        .addSubcommand(sub =>
            sub.setName('status').setDescription('📋 查看本月投票狀態'))
        .addSubcommand(sub =>
            sub.setName('challenges').setDescription('⚔️ 查看進行中的挑戰'))
        .addSubcommandGroup(group =>
            group
                .setName('whitelist')
                .setDescription('👤 白名單管理（管理員）')
                .addSubcommand(sub =>
                    sub.setName('add')
                        .setDescription('加入白名單')
                        .addUserOption(opt =>
                            opt.setName('user').setDescription('目標用戶').setRequired(true)))
                .addSubcommand(sub =>
                    sub.setName('remove')
                        .setDescription('移除白名單')
                        .addUserOption(opt =>
                            opt.setName('user').setDescription('目標用戶').setRequired(true)))
                .addSubcommand(sub =>
                    sub.setName('list').setDescription('查看白名單'))
        ),

    async execute(interaction) {
        const subcommandGroup = interaction.options.getSubcommandGroup(false);
        const subcommand = interaction.options.getSubcommand();

        if (subcommandGroup === 'whitelist') {
            if (interaction.user.id !== ADMIN_DISCORD_ID) {
                return interaction.reply({ content: '僅限管理員使用此指令', ephemeral: true });
            }
            switch (subcommand) {
                case 'add': return handleWhitelistAdd(interaction);
                case 'remove': return handleWhitelistRemove(interaction);
                case 'list': return handleWhitelistList(interaction);
            }
        }

        switch (subcommand) {
            case 'rank': return handleRank(interaction);
            case 'history': return handleHistory(interaction);
            case 'status': return handleStatus(interaction);
            case 'challenges': return handleChallenges(interaction);
        }
    },
};

async function handleRank(interaction) {
    try {
        const users = await iqModel.getAllWhitelistUsers();
        if (users.length === 0) {
            return interaction.reply({ content: '目前沒有白名單用戶', ephemeral: true });
        }

        const ranked = users.filter(u => u.currentRank != null).sort((a, b) => a.currentRank - b.currentRank);
        const unranked = users.filter(u => u.currentRank == null);

        let desc = '';
        for (const u of ranked) {
            const medal = u.currentRank === 1 ? '🥇' : u.currentRank === 2 ? '🥈' : u.currentRank === 3 ? '🥉' : `#${u.currentRank}`;
            const name = u.displayName || u.username;
            const isMe = u.id === interaction.user.id ? ' ← 你' : '';
            desc += `${medal} **${name}**${isMe}\n`;
        }
        if (unranked.length > 0) {
            desc += `\n*尚未排名：${unranked.map(u => u.displayName || u.username).join(', ')}*`;
        }

        const embed = new EmbedBuilder()
            .setTitle('🧠 IQ 排名')
            .setDescription(desc || '尚無排名資料')
            .setColor(0x5865F2)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (err) {
        console.error('Error in /iq rank:', err);
        await interaction.reply({ content: '取得排名時發生錯誤', ephemeral: true });
    }
}

async function handleHistory(interaction) {
    try {
        const history = await iqModel.getUserHistory(interaction.user.id, 12);
        if (history.length === 0) {
            return interaction.reply({ content: '目前沒有歷史排名資料', ephemeral: true });
        }

        const reversed = [...history].reverse();
        const desc = reversed.map(h => `**${h.month}**：第 ${h.finalRank} 名`).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('📈 個人排名歷史')
            .setDescription(desc)
            .setColor(0x3498DB)
            .setFooter({ text: `${interaction.user.username} 的歷史紀錄` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
        console.error('Error in /iq history:', err);
        await interaction.reply({ content: '取得歷史紀錄時發生錯誤', ephemeral: true });
    }
}

async function handleStatus(interaction) {
    try {
        const vote = await iqModel.getCurrentMonthlyVote();
        const allUsers = await iqModel.getAllWhitelistUsers();

        if (!vote) {
            return interaction.reply({ content: '本月尚未開放投票', ephemeral: true });
        }

        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const voters = await iqModel.getVotersByMonth(month);
        const voterSet = new Set(voters);

        const voted = allUsers.filter(u => voterSet.has(u.id));
        const pending = allUsers.filter(u => !voterSet.has(u.id));

        const embed = new EmbedBuilder()
            .setTitle(`📋 ${month} 投票狀態`)
            .setColor(vote.isOpen ? 0x2ECC71 : 0xE74C3C)
            .addFields(
                { name: '📊 狀態', value: vote.isOpen ? '🟢 投票中' : '🔴 已結束', inline: true },
                { name: '✅ 已投票', value: `${voted.length} 人`, inline: true },
                { name: '⏳ 未投票', value: `${pending.length} 人`, inline: true },
            );

        if (pending.length > 0 && interaction.user.id === ADMIN_DISCORD_ID) {
            embed.addFields({
                name: '未投票名單',
                value: pending.map(u => `<@${u.id}>`).join(', '),
            });
        }

        await interaction.reply({ embeds: [embed] });
    } catch (err) {
        console.error('Error in /iq status:', err);
        await interaction.reply({ content: '取得投票狀態時發生錯誤', ephemeral: true });
    }
}

async function handleChallenges(interaction) {
    try {
        const challenges = await iqModel.getPendingChallenges();
        if (challenges.length === 0) {
            return interaction.reply({ content: '目前沒有進行中的挑戰', ephemeral: true });
        }

        let desc = '';
        for (const c of challenges) {
            const proposer = await iqModel.getUser(c.proposerId);
            const target = await iqModel.getUser(c.targetId);
            const direction = c.rankChange > 0 ? `升 ${c.rankChange} 位` : `降 ${Math.abs(c.rankChange)} 位`;
            const deadline = `<t:${Math.floor(new Date(c.votingDeadline).getTime() / 1000)}:R>`;
            desc += `⚔️ **${proposer?.displayName || proposer?.username || c.proposerId}** → **${target?.displayName || target?.username || c.targetId}** (${direction})\n`;
            desc += `  截止：${deadline} | 理由：${(c.reason || '無').slice(0, 50)}\n\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle('⚔️ 進行中的挑戰')
            .setDescription(desc)
            .setColor(0xE74C3C)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (err) {
        console.error('Error in /iq challenges:', err);
        await interaction.reply({ content: '取得挑戰時發生錯誤', ephemeral: true });
    }
}

async function handleWhitelistAdd(interaction) {
    try {
        const targetUser = interaction.options.getUser('user');
        await iqModel.upsertUser(targetUser.id, targetUser.username, targetUser.displayName);
        await iqModel.setWhitelist(targetUser.id, true);

        await interaction.reply({
            content: `✅ 已將 <@${targetUser.id}> 加入白名單`,
            ephemeral: true,
        });
    } catch (err) {
        console.error('Error in whitelist add:', err);
        await interaction.reply({ content: '操作失敗', ephemeral: true });
    }
}

async function handleWhitelistRemove(interaction) {
    try {
        const targetUser = interaction.options.getUser('user');
        await iqModel.setWhitelist(targetUser.id, false);

        await interaction.reply({
            content: `❌ 已將 <@${targetUser.id}> 從白名單移除`,
            ephemeral: true,
        });
    } catch (err) {
        console.error('Error in whitelist remove:', err);
        await interaction.reply({ content: '操作失敗', ephemeral: true });
    }
}

async function handleWhitelistList(interaction) {
    try {
        const users = await iqModel.getAllWhitelistUsers();
        if (users.length === 0) {
            return interaction.reply({ content: '白名單為空', ephemeral: true });
        }

        const desc = users.map((u, i) => `${i + 1}. <@${u.id}> (\`${u.id}\`)`).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('👤 白名單')
            .setDescription(desc)
            .setColor(0x9B59B6)
            .setFooter({ text: `共 ${users.length} 人` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
        console.error('Error in whitelist list:', err);
        await interaction.reply({ content: '取得白名單時發生錯誤', ephemeral: true });
    }
}
