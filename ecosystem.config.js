module.exports = {
  apps: [
    {
      name: 'timesheet-api',
      cwd: './api',
      script: 'dist/src/main.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'timesheet-client',
      cwd: './client',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
