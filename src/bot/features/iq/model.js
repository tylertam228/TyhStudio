const { getPrisma } = require('../../../database/prisma');

// ========================================
// User
// ========================================

async function getUser(id) {
    const prisma = getPrisma();
    return prisma.user.findUnique({ where: { id } });
}

async function upsertUser(id, username, displayName) {
    const prisma = getPrisma();
    return prisma.user.upsert({
        where: { id },
        update: { username, ...(displayName && { displayName }) },
        create: { id, username, displayName: displayName || username, isWhitelist: false },
    });
}

async function getAllWhitelistUsers() {
    const prisma = getPrisma();
    return prisma.user.findMany({ where: { isWhitelist: true }, orderBy: { currentRank: 'asc' } });
}

async function setWhitelist(userId, value) {
    const prisma = getPrisma();
    return prisma.user.update({ where: { id: userId }, data: { isWhitelist: value } });
}

async function updateUserRank(userId, rank) {
    const prisma = getPrisma();
    return prisma.user.update({ where: { id: userId }, data: { currentRank: rank } });
}

// ========================================
// MonthlyVote
// ========================================

async function getCurrentMonthlyVote() {
    const prisma = getPrisma();
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return prisma.monthlyVote.findFirst({ where: { month } });
}

async function openMonthlyVote(month) {
    const prisma = getPrisma();
    const existing = await prisma.monthlyVote.findFirst({ where: { month } });
    if (existing) return existing;
    return prisma.monthlyVote.create({ data: { month, isOpen: true } });
}

async function closeMonthlyVote(month) {
    const prisma = getPrisma();
    const vote = await prisma.monthlyVote.findFirst({ where: { month } });
    if (!vote) return null;
    return prisma.monthlyVote.update({
        where: { id: vote.id },
        data: { isOpen: false, resultPublishedAt: new Date() },
    });
}

// ========================================
// VoteEntry
// ========================================

async function submitVote(voterId, month, rankedOrder) {
    const prisma = getPrisma();
    return prisma.voteEntry.upsert({
        where: { voterId_month: { voterId, month } },
        update: { rankedOrder, submittedAt: new Date() },
        create: { voterId, month, rankedOrder },
    });
}

async function getVoteEntry(voterId, month) {
    const prisma = getPrisma();
    return prisma.voteEntry.findUnique({
        where: { voterId_month: { voterId, month } },
    });
}

async function getVoteEntriesByMonth(month) {
    const prisma = getPrisma();
    return prisma.voteEntry.findMany({ where: { month } });
}

async function getVotersByMonth(month) {
    const prisma = getPrisma();
    const entries = await prisma.voteEntry.findMany({ where: { month }, select: { voterId: true } });
    return entries.map(e => e.voterId);
}

// ========================================
// MonthlyResult
// ========================================

async function saveMonthlyResults(month, results) {
    const prisma = getPrisma();
    const ops = results.map(r =>
        prisma.monthlyResult.upsert({
            where: { month_userId: { month, userId: r.userId } },
            update: { finalRank: r.finalRank },
            create: { month, userId: r.userId, finalRank: r.finalRank },
        })
    );
    return prisma.$transaction(ops);
}

async function getMonthlyResults(month) {
    const prisma = getPrisma();
    return prisma.monthlyResult.findMany({ where: { month }, orderBy: { finalRank: 'asc' } });
}

async function getUserHistory(userId, limit = 12) {
    const prisma = getPrisma();
    return prisma.monthlyResult.findMany({
        where: { userId },
        orderBy: { month: 'desc' },
        take: limit,
    });
}

// ========================================
// Challenge
// ========================================

async function createChallenge(data) {
    const prisma = getPrisma();
    return prisma.challenge.create({ data });
}

async function getChallenge(id) {
    const prisma = getPrisma();
    return prisma.challenge.findUnique({ where: { id } });
}

async function getPendingChallenges() {
    const prisma = getPrisma();
    return prisma.challenge.findMany({ where: { status: 'pending' } });
}

async function updateChallengeStatus(id, status) {
    const prisma = getPrisma();
    return prisma.challenge.update({ where: { id }, data: { status } });
}

async function getRecentChallengesForTarget(targetId, days = 15) {
    const prisma = getPrisma();
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.challenge.findMany({
        where: {
            targetId,
            createdAt: { gte: since },
            status: { not: 'withdrawn' },
        },
    });
}

async function getProposerChallengesThisMonth(proposerId) {
    const prisma = getPrisma();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return prisma.challenge.findMany({
        where: {
            proposerId,
            createdAt: { gte: startOfMonth },
            status: { not: 'withdrawn' },
        },
        orderBy: { createdAt: 'desc' },
    });
}

// ========================================
// ChallengeVote
// ========================================

async function submitChallengeVote(challengeId, voterId, vote) {
    const prisma = getPrisma();
    return prisma.challengeVote.upsert({
        where: { challengeId_voterId: { challengeId, voterId } },
        update: { vote, votedAt: new Date() },
        create: { challengeId, voterId, vote },
    });
}

async function getChallengeVotes(challengeId) {
    const prisma = getPrisma();
    return prisma.challengeVote.findMany({ where: { challengeId } });
}

// ========================================
// ChallengeComment
// ========================================

async function addComment(challengeId, authorId, stance, content) {
    const prisma = getPrisma();
    return prisma.challengeComment.create({
        data: { challengeId, authorId, stance, content },
    });
}

async function getComments(challengeId) {
    const prisma = getPrisma();
    return prisma.challengeComment.findMany({
        where: { challengeId },
        orderBy: { createdAt: 'asc' },
    });
}

// ========================================
// QuarterlyBaseline
// ========================================

async function saveQuarterlyBaselines(quarter, baselines) {
    const prisma = getPrisma();
    const ops = baselines.map(b =>
        prisma.quarterlyBaseline.upsert({
            where: { quarter_userId: { quarter, userId: b.userId } },
            update: { baselineRank: b.baselineRank },
            create: { quarter, userId: b.userId, baselineRank: b.baselineRank },
        })
    );
    return prisma.$transaction(ops);
}

async function getQuarterlyBaseline(quarter, userId) {
    const prisma = getPrisma();
    return prisma.quarterlyBaseline.findUnique({
        where: { quarter_userId: { quarter, userId } },
    });
}

async function getLatestQuarterlyBaselines() {
    const prisma = getPrisma();
    const latest = await prisma.quarterlyBaseline.findFirst({ orderBy: { quarter: 'desc' } });
    if (!latest) return [];
    return prisma.quarterlyBaseline.findMany({
        where: { quarter: latest.quarter },
        orderBy: { baselineRank: 'asc' },
    });
}

// ========================================
// PortalProject
// ========================================

async function getActiveProjects() {
    const prisma = getPrisma();
    return prisma.portalProject.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
}

async function createProject(data) {
    const prisma = getPrisma();
    return prisma.portalProject.create({ data });
}

async function updateProject(id, data) {
    const prisma = getPrisma();
    return prisma.portalProject.update({ where: { id }, data });
}

async function deleteProject(id) {
    const prisma = getPrisma();
    return prisma.portalProject.delete({ where: { id } });
}

module.exports = {
    getUser, upsertUser, getAllWhitelistUsers, setWhitelist, updateUserRank,
    getCurrentMonthlyVote, openMonthlyVote, closeMonthlyVote,
    submitVote, getVoteEntry, getVoteEntriesByMonth, getVotersByMonth,
    saveMonthlyResults, getMonthlyResults, getUserHistory,
    createChallenge, getChallenge, getPendingChallenges, updateChallengeStatus,
    getRecentChallengesForTarget, getProposerChallengesThisMonth,
    submitChallengeVote, getChallengeVotes,
    addComment, getComments,
    saveQuarterlyBaselines, getQuarterlyBaseline, getLatestQuarterlyBaselines,
    getActiveProjects, createProject, updateProject, deleteProject,
};
