/**
 * Web Server
 */

const fastify = require('fastify');

const app = fastify({ logger: false });

app.register(require('@fastify/cors'), {
    origin: true
});

app.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

app.get('/', async (request, reply) => {
    return { 
        name: 'Tiger-228 Bot API',
        version: '2.0.0',
        endpoints: {
            health: '/health',
            oauth: '/oauth/*',
            api: '/api/*',
            iq: '/api/iq/*'
        }
    };
});

// IQ whitelist request webhook (called by SDK server)
app.post('/api/iq/whitelist-request', async (request, reply) => {
    const { userId, username, selfIntro } = request.body || {};
    if (!userId || !username) return { error: 'Missing data' };

    try {
        const { client } = require('../bot/client');
        const { notifyAdmin, buildWhitelistRequestEmbed } = require('../bot/features/iq/notifications');
        const embed = buildWhitelistRequestEmbed(userId, username, selfIntro);
        await notifyAdmin(client, embed);
        return { success: true };
    } catch (err) {
        console.error('Whitelist request notification failed:', err);
        return { error: err.message };
    }
});

async function startWebServer() {
    const port = process.env.PORT || 3000;
    
    try {
        await app.listen({ port, host: '0.0.0.0' });
        console.log(`Web server running on port ${port}`);
    } catch (error) {
        console.error('Failed to start web server:', error);
        throw error;
    }
}

module.exports = { app, startWebServer };
