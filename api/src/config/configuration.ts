export default () => ({
  port: parseInt(process.env.PORT ?? '8080', 10),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    name: process.env.DATABASE_NAME,
  },
});
