import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  configureCors,
  configureGlobalPrefix,
  configureSwagger,
  configureValidation,
  createAppUrls,
} from './config/bootstrap';

const LOG_CONTEXT = 'Bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const apiPrefix = configService.get<string>('API_PREFIX');

  configureCors(app, configService);
  configureGlobalPrefix(app, apiPrefix);
  configureValidation(app);
  configureSwagger(app);
  app.enableShutdownHooks();

  const port = configService.getOrThrow<number>('PORT');
  const host = configService.getOrThrow<string>('HOST');
  const { apiBaseUrl, rootUrl } = createAppUrls(host, port, apiPrefix);

  await app.listen(port, host);

  Logger.log(`API is running at ${apiBaseUrl}`, LOG_CONTEXT);
  Logger.log(`Swagger docs are available at ${rootUrl}/docs`, LOG_CONTEXT);
}

void bootstrap();
