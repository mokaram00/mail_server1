module.exports = {
  apps: [
    {
      name: 'mail-server-admin',
      cwd: './admin',
      script: 'npm',
      args: 'start',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '../logs/admin-error.log',
      out_file: '../logs/admin-out.log',
      log_file: '../logs/admin-combined.log',
      time: true
    },
    {
      name: 'mail-server-api',
      cwd: './api',
      script: 'dist/server.js',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },    
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '../logs/api-error.log',
      out_file: '../logs/api-out.log',
      log_file: '../logs/api-combined.log',
      time: true
    },
    {
      name: 'mail-server-inbox',
      cwd: './inbox',
      script: 'npm',
      args: 'start',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '../logs/inbox-error.log',
      out_file: '../logs/inbox-out.log',
      log_file: '../logs/inbox-combined.log',
      time: true
    },
    {
      name: 'mail-server-shop',
      cwd: './shop',
      script: 'npm',
      args: 'start',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3003
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '../logs/shop-error.log',
      out_file: '../logs/shop-out.log',
      log_file: '../logs/shop-combined.log',
      time: true
    }
  ]
};