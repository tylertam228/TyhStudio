// PM2 Ecosystem Config for TYH Studio
// Production deployment on Vultr VPS

module.exports = {
  apps: [
    // Discord Bot
    {
      name: 'discord-bot',
      script: 'src/index.js',
      cwd: '/opt/tyhstudio',
      node_args: '--env-file=.env',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      autorestart: true,
      restart_delay: 1000,
    },
    // Discord Activity + IQ Server (app.tyhstudio.com)
    {
      name: 'discord-activity',
      script: 'server/server.js',
      cwd: '/opt/tyhstudio/discord_sdk',
      node_args: '--env-file=/opt/tyhstudio/.env',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      autorestart: true,
      restart_delay: 1000,
    },
  ],
};
