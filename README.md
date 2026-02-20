<div align="center">

<img src="https://github.com/tylertam228.png" width="140" alt="Tiger228"/>

# 🐯 TYH Studio

**Discord Bot & Activity Platform**

*Group tools & multiplayer activities for Discord*

[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.js.org)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3FCF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Commands](#-commands) • [Deployment](#-deployment)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 Discord Bot

- **Group Restaurant Picker** - Shared restaurant list with random pick
- **Scheduled Messages** - Automated timed messaging
- **Web Dashboard** - Health & API endpoints

</td>
<td width="50%">

### 🎮 Discord Activity

- **Real-time Lobby** - WebSocket powered room system
- **8-bit Aesthetic** - Pixel art style UI
- **Activity Logging** - Session tracking & statistics

</td>
</tr>
</table>

---

## 📋 Commands

| Category | Command | Description |
|:--------:|---------|-------------|
| 🍽️ | `/eat` | Group restaurant picker (shared list, random pick) |
| ⏰ | `/schedule-msg` | Scheduled messages |
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

# Setup database (run in Supabase SQL Editor)
# → database/schema.sql
# → database/activity_schema.sql

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
DISCORD_GUILD_ID=your_guild_id      # For dev testing

# Discord Activity
VITE_DISCORD_CLIENT_ID=your_activity_client_id
DISCORD_CLIENT_SECRET=your_activity_secret

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Server
PORT=3000
ACTIVITY_PORT=3001
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
│   │       ├── scheduled-msg/   # ⏰ Scheduled messages
│   │       ├── ping/            # 🏓 Ping
│   │       └── tiger228-info/   # 🐯 Info
│   ├── database/                # Supabase client
│   ├── services/                # Background scheduler & logger
│   ├── utils/                   # Utilities
│   └── web/                     # Web server (Fastify)
├── discord_sdk/
│   ├── client/                  # React + Vite frontend
│   └── server/                  # Express + Socket.io backend
├── database/
│   ├── schema.sql               # Bot database schema
│   └── activity_schema.sql      # Activity database schema
├── scripts/
│   └── deploy-commands.js       # Slash command deployer
└── ecosystem.config.js          # PM2 production config

# Websites (separate, not in this repo)
# ~/websites/
#   ├── tiger228.tyhstudio.com/  # Portfolio (React)
#   ├── cv.tyhstudio.com/        # Resume PDF
#   └── ai.tyhstudio.com/        # Coming soon
```

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

### Hosted Subdomains

| Subdomain | Service | Type |
|-----------|---------|------|
| `tiger228.tyhstudio.com` | Portfolio | React (static) |
| `cv.tyhstudio.com` | Resume | PDF file |
| `ai.tyhstudio.com` | AI Feature | Coming soon |
| `activity.tyhstudio.com` | Discord Activity | Node.js |

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Bot Framework | Discord.js v14 |
| Database | PostgreSQL (Supabase) |
| Web Server | Fastify |
| Process Manager | PM2 |
| Activity Frontend | React + Vite |
| Activity Backend | Express + Socket.io |
| Reverse Proxy | Nginx |

---

## 📦 Scripts

```bash
npm start                # Start bot
npm run dev              # Development mode
npm run deploy-commands  # Deploy slash commands

# Activity
npm run activity:dev     # Dev server
npm run activity:build   # Production build
```

---

## 📄 License

MIT © [Tyler Tam](https://tiger228.tyhstudio.com)

---

<div align="center">

**Made with ❤️ by [Tiger228](https://github.com/tylertam228)**

[⬆ Back to top](#-tyh-studio)

</div>
