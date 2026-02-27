const { PrismaClient } = require('@prisma/client');

let prisma = null;

function getPrisma() {
    if (!prisma) {
        prisma = new PrismaClient();
        console.log('Prisma client initialized');
    }
    return prisma;
}

async function disconnectPrisma() {
    if (prisma) {
        await prisma.$disconnect();
        prisma = null;
    }
}

module.exports = { getPrisma, disconnectPrisma };
