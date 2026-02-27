const { EmbedBuilder } = require('discord.js');

const ADMIN_DISCORD_ID = '941708160870260746';

async function notifyAllUsers(client, guildId, embed) {
    try {
        const guild = await client.guilds.fetch(guildId);
        const members = await guild.members.fetch();

        for (const [, member] of members) {
            if (member.user.bot) continue;
            try {
                await member.send({ embeds: [embed] });
            } catch {
                // user might have DMs disabled
            }
        }
    } catch (err) {
        console.error('Failed to notify all users:', err);
    }
}

async function notifyUser(client, userId, embed) {
    try {
        const user = await client.users.fetch(userId);
        await user.send({ embeds: [embed] });
    } catch {
        // user might have DMs disabled
    }
}

async function notifyAdmin(client, embed) {
    await notifyUser(client, ADMIN_DISCORD_ID, embed);
}

function buildVoteOpenEmbed(month) {
    return new EmbedBuilder()
        .setTitle('🧠 IQ 排名投票已開放')
        .setDescription(`${month} 的 IQ 排名投票現已開放！\n請在 5 天內完成投票。`)
        .setColor(0x5865F2)
        .setTimestamp();
}

function buildVoteReminderEmbed(month) {
    return new EmbedBuilder()
        .setTitle('⏰ 投票提醒')
        .setDescription(`${month} 的 IQ 排名投票即將截止！\n請盡快完成投票，明天就要公佈結果了。`)
        .setColor(0xF39C12)
        .setTimestamp();
}

function buildResultEmbed(month, rank, totalUsers) {
    return new EmbedBuilder()
        .setTitle('📊 本月 IQ 排名結果出爐')
        .setDescription(`${month} 結果已公佈！\n你本月排名第 **${rank}** 名（共 ${totalUsers} 人）🧠`)
        .setColor(0x2ECC71)
        .setTimestamp();
}

function buildChallengeNotifyEmbed(proposerName, targetName, rankChange, reason) {
    const direction = rankChange > 0 ? `升 ${rankChange} 位` : `降 ${Math.abs(rankChange)} 位`;
    return new EmbedBuilder()
        .setTitle('⚔️ 新排名挑戰')
        .setDescription(`**${proposerName}** 對 **${targetName}** 發起了排名挑戰`)
        .addFields(
            { name: '📈 排名變動', value: direction, inline: true },
            { name: '📝 理由', value: reason },
        )
        .setColor(0xE74C3C)
        .setTimestamp();
}

function buildChallengeResultEmbed(targetName, status, rankChange) {
    const passed = status === 'approved';
    const direction = rankChange > 0 ? `升 ${rankChange} 位` : `降 ${Math.abs(rankChange)} 位`;
    return new EmbedBuilder()
        .setTitle(passed ? '✅ 挑戰通過' : '❌ 挑戰駁回')
        .setDescription(
            passed
                ? `對 **${targetName}** 的排名挑戰已通過（${direction}），排名已即時更新！`
                : `對 **${targetName}** 的排名挑戰未通過。`
        )
        .setColor(passed ? 0x2ECC71 : 0xE74C3C)
        .setTimestamp();
}

function buildWhitelistRequestEmbed(userId, username, selfIntro) {
    const fields = [
        { name: '用戶', value: `<@${userId}>`, inline: true },
        { name: 'ID', value: `\`${userId}\``, inline: true },
    ];
    if (selfIntro) {
        fields.push({ name: '💬 自我介紹', value: selfIntro });
    }
    fields.push({ name: '📋 操作', value: `使用 \`/iq whitelist add\` 加入白名單` });

    return new EmbedBuilder()
        .setTitle('🔔 白名單申請')
        .setDescription('有新用戶嘗試登入 IQ 排名系統，但不在白名單中。')
        .addFields(...fields)
        .setColor(0xF39C12)
        .setTimestamp();
}

module.exports = {
    ADMIN_DISCORD_ID,
    notifyAllUsers,
    notifyUser,
    notifyAdmin,
    buildVoteOpenEmbed,
    buildVoteReminderEmbed,
    buildResultEmbed,
    buildChallengeNotifyEmbed,
    buildChallengeResultEmbed,
    buildWhitelistRequestEmbed,
};
