module.exports = {
  apps: [
    {
      name: 'sgsg-api',
      cwd: './sgsg-api',
      script: './node_modules/.bin/tsx',
      args: 'src/app.ts',
      interpreter: 'node',
      env: {
        NODE_ENV: 'development',
        PORT: 4000,
        DB_URL: 'postgresql://sgsg:sgsg5goqual123!@localhost:5432/sgsg_db',
        JWT_SECRET: 'fGHs3ZkdmlWunjfCPik+MBsd1E3861T9Cb6IOd9FfRMh8dK8J3Q5EGAgjV91U6N4MUMOwRyCMmPHBQ7zsynqbg==',
        CORS_ORIGIN: 'http://localhost:3001,http://localhost:3002,http://localhost:3003',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        SMTP_SECURE: 'false',
        SMTP_USER: '',
        SMTP_PASS: '',
        SMTP_FROM: 'noreply@sgsg.com',
        FRONTEND_URL: 'http://localhost:3001',
        MOBILE_FRONTEND_URL: 'http://localhost:3002',
        UPLOAD_DIR: './uploads',
        FILE_BASE_URL: 'http://localhost:4000/uploads',
        PG_PROVIDER: 'hecto',
        HECTO_ENV: 'development',
        HECTO_MID: 'devsgsgcare',
        HECTO_API_KEY: 'dev-api-key',
        HECTO_SECRET_KEY: 'dev-secret-key',
        HECTO_API_URL: 'https://dev-api.hecto.co.kr'
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'sgsg-adm',
      cwd: './sgsg-adm',
      script: './node_modules/.bin/vite',
      args: 'preview --port 3001 --host 0.0.0.0',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/admin-error.log',
      out_file: './logs/admin-out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'sgsg-exp',
      cwd: './sgsg-exp',
      script: './node_modules/.bin/vite',
      args: 'preview --port 3002 --host 0.0.0.0',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        VITE_API_BASE_URL: 'http://localhost:4000/api/v1'
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/expert-error.log',
      out_file: './logs/expert-out.log',
      merge_logs: true,
      time: true
    },
    {
      name: 'sgsg-customer',
      cwd: './sgsg-customer',
      script: './node_modules/.bin/serve',
      args: '-s dist -l 3003 -n',
      env: {
        NODE_ENV: 'production',
        PORT: 3003
      },
      watch: false,
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/customer-error.log',
      out_file: './logs/customer-out.log',
      merge_logs: true,
      time: true
    }
  ]
};