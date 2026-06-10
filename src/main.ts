import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { appConfig } from './config/app.config';
import { setupApiDocs } from './config/swagger.config';

async function bootstrap() {
  process.loadEnvFile();
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({ origin: 'http://localhost:3000', credentials: true });
  app.setGlobalPrefix(appConfig.apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  setupApiDocs(app);

  const port = appConfig.port;
  await app.listen(port);
  Logger.log(`Backend running on port ${port}`, 'Bootstrap');
  Logger.log(
    `Admin Scalar docs available at /${appConfig.apiPrefix}/${appConfig.docs.adminPath}`,
    'Bootstrap',
  );
  Logger.log(
    `Mobile Scalar docs available at /${appConfig.apiPrefix}/${appConfig.docs.mobilePath}`,
    'Bootstrap',
  );
}
bootstrap();
