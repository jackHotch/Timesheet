import { NestFactory, } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);
  app.enableCors({
    origin: config.get<string>('clientUrl'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  const port = config.get<number>('port') ?? 8080;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application running on port ${port}`);
}
bootstrap();
