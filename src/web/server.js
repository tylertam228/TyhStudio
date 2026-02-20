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
        version: '1.0.0',
        endpoints: {
            health: '/health',
            oauth: '/oauth/*',
            api: '/api/*'
        }
    };
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
