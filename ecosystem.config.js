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
    // Discord Activity + IQ Server (activity.tyhstudio.com)
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
    // HK Weather (hkweather.tyhstudio.com)
    {
      name: 'hkweather',
      script: '/var/www/hkweather.tyhstudio.com/venv/bin/gunicorn',
      args: 'weatherapp.wsgi:application --bind 127.0.0.1:8005 --workers 2 --timeout 30',
      cwd: '/var/www/hkweather.tyhstudio.com',
      interpreter: 'none',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '300M',
      autorestart: true,
      restart_delay: 1000,
      env: {
        DJANGO_SECRET_KEY: process.env.DJANGO_SECRET_KEY,
        DJANGO_DEBUG: 'False',
        DJANGO_ALLOWED_HOSTS: 'hkweather.tyhstudio.com',
      },
    },
    // Password Forge (passwordforge.tyhstudio.com)
    {
      name: "passwordforge",
      script: "dotnet",
      args: "PasswordGenerator.dll",
      cwd: "/var/www/passwordforge.tyhstudio.com",
      env: {
        ASPNETCORE_ENVIRONMENT: "Production",
        ASPNETCORE_URLS: "http://localhost:5050"
      }
    }
  ],
};