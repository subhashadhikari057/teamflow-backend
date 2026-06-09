import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './config/app.config';
import { setupApiDocs } from './config/swagger.config';

async function bootstrap() {
  process.loadEnvFile();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(appConfig.apiPrefix);
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
