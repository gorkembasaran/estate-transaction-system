import {
  BadRequestException,
  INestApplication,
  Logger,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  configureCors(app, configService);
  configureGlobalPrefix(app, configService);
  configureValidation(app);
  app.enableShutdownHooks();

  const port = configService.getOrThrow<number>('PORT');
  const host = configService.getOrThrow<string>('HOST');
  const baseUrl = getBaseUrl(host, port, configService);

  await app.listen(port, host);

  Logger.log(`API is running at ${baseUrl}`, 'Bootstrap');
}

function configureCors(app: INestApplication, configService: ConfigService) {
  const frontendOrigin = configService.get<string>('FRONTEND_ORIGIN');
  const nodeEnv = configService.get<string>('NODE_ENV');

  app.enableCors({
    origin: createCorsOriginMatcher(frontendOrigin, nodeEnv),
  });
}

function createCorsOriginMatcher(frontendOrigin?: string, nodeEnv?: string) {
  const configuredOrigins = parseCorsOrigins(frontendOrigin);

  if (nodeEnv === 'production') {
    return configuredOrigins.length > 0 ? configuredOrigins : false;
  }

  const developmentOrigins = [
    'http://127.0.0.1:3001',
    'http://localhost:3001',
  ];

  return Array.from(new Set([...configuredOrigins, ...developmentOrigins]));
}

function parseCorsOrigins(frontendOrigin?: string) {
  if (!frontendOrigin) {
    return [];
  }

  return frontendOrigin
    .split(',')
    .map((origin) => origin.trim())
    .map((origin) => origin.replace(/\/+$/g, ''))
    .filter(Boolean);
}

function configureGlobalPrefix(
  app: INestApplication,
  configService: ConfigService,
) {
  const apiPrefix = configService.get<string>('API_PREFIX');

  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }
}

function configureValidation(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) =>
        new BadRequestException({
          errors: flattenValidationErrors(errors),
          message: 'Validation failed',
        }),
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
}

function getBaseUrl(
  host: string,
  port: number,
  configService: ConfigService,
) {
  const apiPrefix = configService.get<string>('API_PREFIX');
  const displayHost = host === '0.0.0.0' ? '127.0.0.1' : host;
  const rootUrl = `http://${displayHost}:${port}`;

  return apiPrefix ? `${rootUrl}/${apiPrefix}` : rootUrl;
}

function flattenValidationErrors(errors: ValidationError[]) {
  return errors.flatMap((error) => mapValidationError(error));
}

function mapValidationError(
  error: ValidationError,
  parentPath?: string,
): Array<{ field: string; messages: string[] }> {
  const fieldPath = parentPath
    ? `${parentPath}.${error.property}`
    : error.property;
  const ownMessages = error.constraints ? Object.values(error.constraints) : [];
  const childMessages =
    error.children?.flatMap((child) => mapValidationError(child, fieldPath)) ??
    [];

  if (ownMessages.length === 0) {
    return childMessages;
  }

  return [{ field: fieldPath, messages: ownMessages }, ...childMessages];
}

bootstrap();
