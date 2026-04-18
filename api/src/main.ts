import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.enableCors({ origin: config.get<string>('clientUrl') });
  await app.listen(config.get<number>('port') ?? 8080, '0.0.0.0');
}
bootstrap();
