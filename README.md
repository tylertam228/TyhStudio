<div align="center">

<img src="https://github.com/tylertam228.png" width="140" alt="Tiger228"/>

# 🐯 TYH Studio

**Discord Bot & Activity Platform**

*Group tools, IQ ranking, and multiplayer activities for Discord*

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma&logoColor=white)](https://www.prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Commands](#-commands) • [Deployment](#-deployment)

</div>

---

## ✨ Features

<table>
<tr>
<td width="33%">

### 🤖 Discord Bot

- **Group Restaurant Picker** - Shared restaurant list with random pick
- **IQ Rank Commands** - Check rankings, history & challenges
- **Web Dashboard** - Health & API endpoints

</td>
<td width="33%">

### 🧠 IQ Rank System

- **Monthly Voting** - Drag-and-drop anonymous ranking
- **Challenge System** - Propose rank changes with voting
- **Discussion Board** - Real-time Socket.IO debates
- **Quarterly Calibration** - Auto baseline calculation
- **History Charts** - Personal rank trend visualization

</td>
<td width="33%">

### 🎮 Discord Activity

- **Project Portal** - Browse TYH Studio projects
- **Real-time Lobby** - WebSocket powered room system
- **Cyberpunk Neon UI** - Terminal-style dark theme
- **Admin Panel** - Manage projects & whitelist

</td>
</tr>
</table>

---

## 📋 Commands

| Category | Command | Description |
|:--------:|---------|-------------|
| 🍽️ | `/eat` | Group restaurant picker |
| 🧠 | `/iq` | IQ ranking system |
| 🏓 | `/ping` | Check bot latency |
| 🐯 | `/tiger228_info` | About the developer |

### `/eat` Subcommands

| Subcommand | Description |
|------------|-------------|
| `/eat add` | Add a restaurant to the group list |
| `/eat random` | Randomly pick from everyone's restaurants |
| `/eat list` | View all restaurants in the group |
| `/eat rate` | Rate a restaurant |
| `/eat delete` | Delete a restaurant (owner only) |

### `/iq` Subcommands

| Subcommand | Description |
|------------|-------------|
| `/iq rank` | View current IQ rankings |
| `/iq history` | View personal rank history |
| `/iq status` | Check monthly voting status |
| `/iq challenges` | View active challenges |
| `/iq whitelist add` | Add user to whitelist (admin) |
| `/iq whitelist remove` | Remove from whitelist (admin) |
| `/iq whitelist list` | View whitelist (admin) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL ([Supabase](https://supabase.com))
- Discord Application

### Installation

```bash
# Clone
git clone https://github.com/tylertam228/TyhStudio.git
cd TyhStudio

# Install dependencies
npm install

# Discord SDK dependencies
cd discord_sdk/client && npm install
cd ../server && npm install
cd ../..

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Setup database
npm run db:push       # Push Prisma schema to database

# Deploy slash commands
npm run deploy-commands

# Start bot
npm start
```

### Environment Variables

```env
# Discord Bot
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_secret
DISCORD_GUILD_ID=your_guild_id      # For dev testing

# Discord Activity
VITE_DISCORD_CLIENT_ID=your_activity_client_id
ACTIVITY_PORT=3001

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Prisma (Supabase direct connection)
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

# Server
PORT=3000
API_PORT=4000
```

---

## 📁 Project Structure

```
TyhStudio/
├── src/
│   ├── index.js                 # Entry point
│   ├── bot/
│   │   ├── client.js            # Discord client
│   │   ├── commands.js          # Command loader
│   │   ├── events/              # Event handlers
│   │   └── features/
│   │       ├── eat/             # 🍽️ Group restaurant picker
│   │       ├── iq/              # 🧠 IQ rank system (commands + scheduler)
│   │       ├── ping/            # 🏓 Ping
│   │       └── tiger228-info/   # 🐯 Info
│   ├── database/
│   │   ├── supabase.js          # Supabase client (existing features)
│   │   └── prisma.js            # Prisma client (IQ system)
│   ├── services/                # Background scheduler & logger
│   ├── utils/                   # Utilities
│   └── web/                     # Web server (Fastify)
├── discord_sdk/
│   ├── client/                  # React + Vite frontend
│   │   └── src/
│   │       ├── components/
│   │       │   ├── portal/      # Project portal (home page)
│   │       │   ├── iq/          # IQ rank voting, challenges, charts
│   │       │   ├── Lobby.jsx    # Game lobby
│   │       │   └── ...
│   │       ├── hooks/           # Discord SDK & Socket hooks
│   │       ├── store/           # Zustand state management
│   │       └── utils/           # API client
│   └── server/                  # Express + Socket.io backend
│       └── routes/
│           └── iq.js            # IQ API endpoints
├── prisma/
│   └── schema.prisma            # Database schema (IQ system)
├── database/
│   ├── schema.sql               # Bot database schema (Supabase)
│   └── activity_schema.sql      # Activity database schema
├── scripts/
│   └── deploy-commands.js       # Slash command deployer
└── ecosystem.config.js          # PM2 production config
```

---

## 🧠 IQ Rank System Architecture

### Monthly Voting Flow

| Day | Time | Event |
|-----|------|-------|
| 1st | 09:00 | Open voting + notify all users |
| 1st–5th | — | Voting window (drag-and-drop ranking) |
| 5th | 09:00 | Remind non-voters |
| 6th | 08:55 | Mark abstentions |
| 6th | 09:00 | Close voting + publish results |

### Challenge System

- Submit challenges after monthly results are published
- 3-day voting period with 50% quorum requirement
- Real-time discussion board (Socket.IO)
- Boundary case (45%–55% agree) triggers 2-day extension

### Quarterly Calibration

- Runs every quarter (months 1, 4, 7, 10)
- Averages past 3 months of rankings for baseline reference

---

## 🚢 Deployment

### PM2 (Production)

```bash
# Start all services
pm2 start ecosystem.config.js

# Save for auto-restart
pm2 save
pm2 startup
```

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Bot Framework | Discord.js v14 |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Scheduling | node-cron |
| Web Server | Fastify |
| Process Manager | PM2 |
| Activity Frontend | React + Vite + dnd-kit + Recharts |
| Activity Backend | Express + Socket.IO |
| Real-time | Socket.IO |
| Auth | Discord OAuth2 |
| Reverse Proxy | Nginx |

---

## 📦 Scripts

```bash
npm start                # Start bot
npm run dev              # Development mode
npm run deploy-commands         # Deploy to dev guilds
npm run deploy-commands:global  # Deploy globally

# Database (Prisma)
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio

# Activity
npm run activity:dev     # Dev server
npm run activity:build   # Production build
```

---

## 📄 License

MIT © [Tyler Tam](https://tyhstudio.com)

---

<div align="center">

**Made with ❤️ by [Tiger228](https://github.com/tylertam228)**

[⬆ Back to top](#-tyh-studio)

</div>
