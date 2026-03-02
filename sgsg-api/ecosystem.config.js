module.exports = {
  apps: [
    {
      name: 'sgsg-api',
      script: 'working-app.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 4000
      },
      env_production: {
        NODE_ENV: 'production', 
        PORT: 4000
      },
      // Log configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log', 
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Application behavior
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '500M',
      
      // Restart policy
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Additional options
      merge_logs: true,
      kill_timeout: 5000
    }
  ]
};