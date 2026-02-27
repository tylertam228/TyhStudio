const cron = require('node-cron');
const iqModel = require('./model');
const {
    notifyAllUsers, notifyUser,
    buildVoteOpenEmbed, buildVoteReminderEmbed, buildResultEmbed,
} = require('./notifications');

const GUILD_ID = '819096043818975273';
const CRON_TZ = 'Asia/Hong_Kong';

function register(client, intervals) {
    // Day 1 09:00 - Open monthly voting
    cron.schedule('0 9 1 * *', () => openMonthlyVoting(client), { timezone: CRON_TZ });

    // Day 5 09:00 - Remind non-voters
    cron.schedule('0 9 5 * *', () => remindPendingVoters(client), { timezone: CRON_TZ });

    // Day 6 08:55 - Mark abstentions
    cron.schedule('55 8 6 * *', () => markAbstentions(client), { timezone: CRON_TZ });

    // Day 6 09:00 - Close voting and publish results
    cron.schedule('0 9 6 * *', () => closeVotingAndPublishResults(client), { timezone: CRON_TZ });

    // Quarterly calibration: month 1,4,7,10 day 6 10:00
    cron.schedule('0 10 6 1,4,7,10 *', () => runQuarterlyCalibration(client), { timezone: CRON_TZ });

    // Check pending challenges every hour
    cron.schedule('0 * * * *', () => checkChallengeDeadlines(client), { timezone: CRON_TZ });

    console.log('  IQ scheduler registered (node-cron)');
}

function getCurrentMonth() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: CRON_TZ }));
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentQuarter() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: CRON_TZ }));
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `${now.getFullYear()}-Q${q}`;
}

async function openMonthlyVoting(client) {
    try {
        const month = getCurrentMonth();
        await iqModel.openMonthlyVote(month);
        const embed = buildVoteOpenEmbed(month);
        await notifyAllUsers(client, GUILD_ID, embed);
        console.log(`[IQ] Monthly voting opened: ${month}`);
    } catch (err) {
        console.error('[IQ] Failed to open voting:', err);
    }
}

async function remindPendingVoters(client) {
    try {
        const month = getCurrentMonth();
        const vote = await iqModel.getCurrentMonthlyVote();
        if (!vote || !vote.isOpen) return;

        const allUsers = await iqModel.getAllWhitelistUsers();
        const voters = await iqModel.getVotersByMonth(month);
        const voterSet = new Set(voters);
        const embed = buildVoteReminderEmbed(month);

        for (const user of allUsers) {
            if (!voterSet.has(user.id)) {
                await notifyUser(client, user.id, embed);
            }
        }
        console.log(`[IQ] Reminded pending voters for: ${month}`);
    } catch (err) {
        console.error('[IQ] Failed to remind voters:', err);
    }
}

async function markAbstentions(client) {
    try {
        const month = getCurrentMonth();
        const allUsers = await iqModel.getAllWhitelistUsers();
        const voters = await iqModel.getVotersByMonth(month);
        const voterSet = new Set(voters);
        const abstained = allUsers.filter(u => !voterSet.has(u.id));
        console.log(`[IQ] Abstentions for ${month}: ${abstained.map(u => u.username).join(', ') || 'none'}`);
    } catch (err) {
        console.error('[IQ] Failed to mark abstentions:', err);
    }
}

async function closeVotingAndPublishResults(client) {
    try {
        const month = getCurrentMonth();
        const vote = await iqModel.getCurrentMonthlyVote();
        if (!vote || !vote.isOpen) return;

        await iqModel.closeMonthlyVote(month);

        const entries = await iqModel.getVoteEntriesByMonth(month);
        const allUsers = await iqModel.getAllWhitelistUsers();

        if (entries.length === 0) {
            console.log(`[IQ] No votes submitted for ${month}`);
            return;
        }

        // Calculate average rank for each user
        const rankSums = {};
        const rankCounts = {};

        for (const entry of entries) {
            const ranked = entry.rankedOrder;
            if (!Array.isArray(ranked)) continue;
            ranked.forEach((userId, idx) => {
                rankSums[userId] = (rankSums[userId] || 0) + (idx + 1);
                rankCounts[userId] = (rankCounts[userId] || 0) + 1;
            });
        }

        const averages = Object.keys(rankSums).map(userId => ({
            userId,
            avgRank: rankSums[userId] / rankCounts[userId],
        }));

        averages.sort((a, b) => a.avgRank - b.avgRank);

        const results = averages.map((item, idx) => ({
            userId: item.userId,
            finalRank: idx + 1,
        }));

        await iqModel.saveMonthlyResults(month, results);

        // Update currentRank and notify each user
        for (const r of results) {
            await iqModel.updateUserRank(r.userId, r.finalRank);
            const embed = buildResultEmbed(month, r.finalRank, results.length);
            await notifyUser(client, r.userId, embed);
        }

        console.log(`[IQ] Results published for ${month}: ${results.length} users ranked`);
    } catch (err) {
        console.error('[IQ] Failed to close voting:', err);
    }
}

async function runQuarterlyCalibration(client) {
    try {
        const quarter = getCurrentQuarter();
        const now = new Date(new Date().toLocaleString('en-US', { timeZone: CRON_TZ }));
        const currentMonth = now.getMonth() + 1;

        // Get past 3 months
        const months = [];
        for (let i = 2; i >= 0; i--) {
            const d = new Date(now.getFullYear(), currentMonth - 1 - i, 1);
            months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        const allUsers = await iqModel.getAllWhitelistUsers();
        const baselines = [];

        for (const user of allUsers) {
            let sum = 0;
            let count = 0;
            for (const month of months) {
                const results = await iqModel.getMonthlyResults(month);
                const userResult = results.find(r => r.userId === user.id);
                if (userResult) {
                    sum += userResult.finalRank;
                    count++;
                }
            }
            if (count > 0) {
                baselines.push({ userId: user.id, baselineRank: Math.round(sum / count) });
            }
        }

        if (baselines.length > 0) {
            await iqModel.saveQuarterlyBaselines(quarter, baselines);
        }

        console.log(`[IQ] Quarterly calibration done for ${quarter}: ${baselines.length} baselines`);
    } catch (err) {
        console.error('[IQ] Failed quarterly calibration:', err);
    }
}

async function checkChallengeDeadlines(client) {
    try {
        const challenges = await iqModel.getPendingChallenges();
        const now = new Date();

        for (const challenge of challenges) {
            if (new Date(challenge.votingDeadline) <= now) {
                await settleChallengeVote(client, challenge);
            }
        }
    } catch (err) {
        console.error('[IQ] Failed to check challenge deadlines:', err);
    }
}

async function settleChallengeVote(client, challenge) {
    const { buildChallengeResultEmbed } = require('./notifications');
    const allUsers = await iqModel.getAllWhitelistUsers();
    const votes = await iqModel.getChallengeVotes(challenge.id);
    const totalUsers = allUsers.length;
    const totalVoters = votes.length;
    const agreeCount = votes.filter(v => v.vote === 'agree').length;

    const quorum = totalVoters >= Math.ceil(totalUsers * 0.5);
    const agreeRatio = totalVoters > 0 ? agreeCount / totalVoters : 0;

    // Boundary case: 45%-55% → extend 2 days
    if (quorum && agreeRatio >= 0.45 && agreeRatio <= 0.55) {
        const extended = new Date(challenge.votingDeadline);
        extended.setDate(extended.getDate() + 2);
        if (extended > new Date()) {
            await iqModel.updateChallengeStatus(challenge.id, 'pending');
            // Update deadline by re-creating (Prisma update)
            const prisma = require('../../../database/prisma').getPrisma();
            await prisma.challenge.update({
                where: { id: challenge.id },
                data: { votingDeadline: extended },
            });
            console.log(`[IQ] Challenge ${challenge.id} extended to ${extended.toISOString()}`);
            return;
        }
    }

    const passed = quorum && agreeRatio >= 0.5;
    const status = passed ? 'approved' : 'rejected';
    await iqModel.updateChallengeStatus(challenge.id, status);

    if (passed) {
        const target = await iqModel.getUser(challenge.targetId);
        if (target) {
            const newRank = (target.currentRank || 0) + challenge.rankChange;
            await iqModel.updateUserRank(challenge.targetId, Math.max(1, newRank));
        }
    }

    const targetUser = await iqModel.getUser(challenge.targetId);
    const embed = buildChallengeResultEmbed(
        targetUser?.username || challenge.targetId,
        status,
        challenge.rankChange
    );
    await notifyAllUsers(client, GUILD_ID, embed);

    console.log(`[IQ] Challenge ${challenge.id} settled: ${status}`);
}

module.exports = { register };
