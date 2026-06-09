import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  process.loadEnvFile();
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  Logger.log(`Backend running on port ${port}`, 'Bootstrap');
}
bootstrap();
