import { Router } from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('../../../node_modules/@prisma/client');

const prisma = new PrismaClient();
const router = Router();
const ADMIN_DISCORD_ID = '941708160870260746';

// ========================================
// Middleware: verify Discord access token
// ========================================
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authorization' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const response = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return res.status(401).json({ error: 'Invalid token' });

        const user = await response.json();
        req.discordUser = user;
        next();
    } catch {
        res.status(401).json({ error: 'Authentication failed' });
    }
}

function requireAdmin(req, res, next) {
    if (req.discordUser.id !== ADMIN_DISCORD_ID) {
        return res.status(403).json({ error: 'Admin only' });
    }
    next();
}

// ========================================
// Auth check + whitelist gate
// ========================================
router.get('/me', requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.discordUser.id } });

    if (user && user.isWhitelist) {
        const displayName = req.discordUser.global_name || req.discordUser.username;
        await prisma.user.update({
            where: { id: req.discordUser.id },
            data: { username: req.discordUser.username, displayName },
        });
        return res.json({
            authenticated: true,
            whitelisted: true,
            user: { ...req.discordUser, currentRank: user.currentRank, displayName },
        });
    }

    return res.json({ authenticated: true, whitelisted: false, user: req.discordUser });
});

router.post('/whitelist-request', requireAuth, async (req, res) => {
    const { selfIntro } = req.body;
    const botPort = process.env.PORT || 3000;
    try {
        await fetch(`http://localhost:${botPort}/api/iq/whitelist-request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: req.discordUser.id,
                username: req.discordUser.global_name || req.discordUser.username,
                selfIntro: selfIntro || null,
            }),
        });
    } catch { /* bot might not be running */ }
    res.json({ success: true });
});

// ========================================
// Voting
// ========================================
router.get('/vote/status', requireAuth, async (req, res) => {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const vote = await prisma.monthlyVote.findFirst({ where: { month } });
    const myEntry = await prisma.voteEntry.findUnique({
        where: { voterId_month: { voterId: req.discordUser.id, month } },
    });
    const allUsers = await prisma.user.findMany({ where: { isWhitelist: true } });
    const usersExcludeSelf = allUsers.filter(u => u.id !== req.discordUser.id);

    res.json({
        month,
        isOpen: vote?.isOpen ?? false,
        hasVoted: !!myEntry,
        myRankedOrder: myEntry?.rankedOrder ?? null,
        users: usersExcludeSelf.map(u => ({ id: u.id, username: u.displayName || u.username, currentRank: u.currentRank })),
    });
});

router.post('/vote/submit', requireAuth, async (req, res) => {
    const { rankedOrder } = req.body;
    if (!Array.isArray(rankedOrder) || rankedOrder.length === 0) {
        return res.status(400).json({ error: 'Invalid rankedOrder' });
    }

    if (rankedOrder.includes(req.discordUser.id)) {
        return res.status(400).json({ error: 'Cannot include yourself in ranking' });
    }

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const vote = await prisma.monthlyVote.findFirst({ where: { month } });
    if (!vote || !vote.isOpen) {
        return res.status(400).json({ error: 'Voting is not open' });
    }

    const entry = await prisma.voteEntry.upsert({
        where: { voterId_month: { voterId: req.discordUser.id, month } },
        update: { rankedOrder, submittedAt: new Date() },
        create: { voterId: req.discordUser.id, month, rankedOrder },
    });

    res.json({ success: true, entry });
});

// ========================================
// Results & History
// ========================================
router.get('/results/:month', requireAuth, async (req, res) => {
    const results = await prisma.monthlyResult.findMany({
        where: { month: req.params.month },
        orderBy: { finalRank: 'asc' },
    });

    const enriched = await Promise.all(results.map(async r => {
        const user = await prisma.user.findUnique({ where: { id: r.userId } });
        return { ...r, username: user?.username ?? r.userId };
    }));

    res.json(enriched);
});

router.get('/history', requireAuth, async (req, res) => {
    const history = await prisma.monthlyResult.findMany({
        where: { userId: req.discordUser.id },
        orderBy: { month: 'desc' },
        take: 12,
    });
    res.json(history);
});

router.get('/rank', requireAuth, async (req, res) => {
    const users = await prisma.user.findMany({
        where: { isWhitelist: true },
        orderBy: { currentRank: 'asc' },
    });
    res.json(users.map(u => ({ id: u.id, username: u.displayName || u.username, currentRank: u.currentRank })));
});

// ========================================
// Challenges
// ========================================
router.get('/challenges', requireAuth, async (req, res) => {
    const challenges = await prisma.challenge.findMany({
        where: { status: { in: ['pending'] } },
        orderBy: { createdAt: 'desc' },
    });

    const enriched = await Promise.all(challenges.map(async c => {
        const proposer = await prisma.user.findUnique({ where: { id: c.proposerId } });
        const target = await prisma.user.findUnique({ where: { id: c.targetId } });
        const votes = await prisma.challengeVote.findMany({ where: { challengeId: c.id } });
        const comments = await prisma.challengeComment.findMany({
            where: { challengeId: c.id },
            orderBy: { createdAt: 'asc' },
        });
        return {
            ...c,
            proposerName: proposer?.displayName || proposer?.username || c.proposerId,
            targetName: target?.displayName || target?.username || c.targetId,
            agreeCount: votes.filter(v => v.vote === 'agree').length,
            disagreeCount: votes.filter(v => v.vote === 'disagree').length,
            myVote: votes.find(v => v.voterId === req.discordUser.id)?.vote ?? null,
            commentCount: comments.length,
        };
    }));

    res.json(enriched);
});

router.post('/challenges', requireAuth, async (req, res) => {
    const { targetId, rankChange, reason } = req.body;
    const proposerId = req.discordUser.id;

    if (!targetId || rankChange == null || !reason) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    // Check voting is closed
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const vote = await prisma.monthlyVote.findFirst({ where: { month } });
    if (vote?.isOpen) {
        return res.status(400).json({ error: 'Can only submit challenges after voting closes' });
    }

    // Cooldown: same target 15 days
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const recentTarget = await prisma.challenge.findFirst({
        where: { targetId, createdAt: { gte: fifteenDaysAgo }, status: { not: 'withdrawn' } },
    });
    if (recentTarget) {
        return res.status(400).json({ error: '同一被挑戰者 15 天內只能被申請一次挑戰' });
    }

    // Proposer limit: max 2 per month, 7 days between
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const proposerChallenges = await prisma.challenge.findMany({
        where: { proposerId, createdAt: { gte: startOfMonth }, status: { not: 'withdrawn' } },
        orderBy: { createdAt: 'desc' },
    });

    if (proposerChallenges.length >= 2) {
        return res.status(400).json({ error: '每月最多發起 2 次挑戰' });
    }

    if (proposerChallenges.length === 1) {
        const lastChallenge = proposerChallenges[0];
        const daysSince = (now - new Date(lastChallenge.createdAt)) / (24 * 60 * 60 * 1000);
        if (daysSince < 7) {
            return res.status(400).json({ error: '第 2 次挑戰距第 1 次不得少於 7 天' });
        }
    }

    const deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const challenge = await prisma.challenge.create({
        data: { proposerId, targetId, rankChange: parseInt(rankChange), reason, votingDeadline: deadline },
    });

    res.json(challenge);
});

router.post('/challenges/:id/vote', requireAuth, async (req, res) => {
    const { vote } = req.body;
    if (!['agree', 'disagree'].includes(vote)) {
        return res.status(400).json({ error: 'Invalid vote' });
    }

    const result = await prisma.challengeVote.upsert({
        where: { challengeId_voterId: { challengeId: req.params.id, voterId: req.discordUser.id } },
        update: { vote, votedAt: new Date() },
        create: { challengeId: req.params.id, voterId: req.discordUser.id, vote },
    });

    res.json(result);
});

router.post('/challenges/:id/withdraw', requireAuth, async (req, res) => {
    const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
    if (!challenge) return res.status(404).json({ error: 'Not found' });
    if (challenge.proposerId !== req.discordUser.id) return res.status(403).json({ error: 'Not proposer' });

    const hoursLeft = (new Date(challenge.votingDeadline) - new Date()) / (60 * 60 * 1000);
    if (hoursLeft < 12) {
        return res.status(400).json({ error: '截止前 12 小時內才可撤回' });
    }

    await prisma.challenge.update({ where: { id: req.params.id }, data: { status: 'withdrawn' } });
    res.json({ success: true });
});

// ========================================
// Discussion Comments
// ========================================
router.get('/challenges/:id/comments', requireAuth, async (req, res) => {
    const comments = await prisma.challengeComment.findMany({
        where: { challengeId: req.params.id },
        orderBy: { createdAt: 'asc' },
    });

    const enriched = await Promise.all(comments.map(async c => {
        const author = await prisma.user.findUnique({ where: { id: c.authorId } });
        return { ...c, authorName: author?.username ?? c.authorId };
    }));

    res.json(enriched);
});

router.post('/challenges/:id/comments', requireAuth, async (req, res) => {
    const { stance, content } = req.body;
    if (!['agree', 'disagree'].includes(stance) || !content) {
        return res.status(400).json({ error: 'Invalid comment' });
    }

    const comment = await prisma.challengeComment.create({
        data: {
            challengeId: req.params.id,
            authorId: req.discordUser.id,
            stance,
            content,
        },
    });

    res.json(comment);
});

// ========================================
// Quarterly Baseline
// ========================================
router.get('/baseline/:userId', requireAuth, async (req, res) => {
    const latest = await prisma.quarterlyBaseline.findFirst({ orderBy: { quarter: 'desc' } });
    if (!latest) return res.json(null);

    const baseline = await prisma.quarterlyBaseline.findUnique({
        where: { quarter_userId: { quarter: latest.quarter, userId: req.params.userId } },
    });
    res.json(baseline);
});

// ========================================
// Admin: Whitelist
// ========================================
router.get('/admin/whitelist', requireAuth, requireAdmin, async (req, res) => {
    const users = await prisma.user.findMany({ where: { isWhitelist: true } });
    res.json(users);
});

router.post('/admin/whitelist', requireAuth, requireAdmin, async (req, res) => {
    const { userId, username } = req.body;
    const user = await prisma.user.upsert({
        where: { id: userId },
        update: { isWhitelist: true, username },
        create: { id: userId, username, isWhitelist: true },
    });
    res.json(user);
});

router.delete('/admin/whitelist/:userId', requireAuth, requireAdmin, async (req, res) => {
    await prisma.user.update({ where: { id: req.params.userId }, data: { isWhitelist: false } });
    res.json({ success: true });
});

// ========================================
// Admin: Portal Projects
// ========================================
router.get('/projects', async (req, res) => {
    const projects = await prisma.portalProject.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
    });
    res.json(projects);
});

router.post('/admin/projects', requireAuth, requireAdmin, async (req, res) => {
    const { title, description, url, imageUrl, sortOrder } = req.body;
    const project = await prisma.portalProject.create({
        data: { title, description, url, imageUrl, sortOrder: sortOrder ?? 0 },
    });
    res.json(project);
});

router.put('/admin/projects/:id', requireAuth, requireAdmin, async (req, res) => {
    const { title, description, url, imageUrl, sortOrder, isActive } = req.body;
    const project = await prisma.portalProject.update({
        where: { id: req.params.id },
        data: { title, description, url, imageUrl, sortOrder, isActive },
    });
    res.json(project);
});

router.delete('/admin/projects/:id', requireAuth, requireAdmin, async (req, res) => {
    await prisma.portalProject.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});

export default router;
