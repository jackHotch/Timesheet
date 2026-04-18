export default () => ({
  port: parseInt(process.env.PORT ?? '8080', 10),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3000',
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
  },
});
