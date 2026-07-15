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
  aws: {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: process.env.AWS_S3_BUCKET,
  },
});
