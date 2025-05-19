module.exports = {
  apps: [{
    name: 'cv-sem-frescura',
    script: './server.js',
    instances: 'max',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production'
      // PORT será injetado pelo Railway
    }
  }],

  deploy: {
    production: {
      user: 'seu_usuario',
      host: 'seu_servidor',
      ref: 'origin/main',
      repo: 'git@github.com:rafaelnovaes22/cvsemfrescura.git',
      path: '/var/www/cvsemfrescura',
      'post-deploy': 'npm ci --production && pm2 reload ecosystem.config.js --env production'
    }
  }
};
