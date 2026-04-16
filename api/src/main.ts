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
  const baseUrl = getBaseUrl(port, configService);

  await app.listen(port);

  Logger.log(`API is running at ${baseUrl}`, 'Bootstrap');
}

function configureCors(app: INestApplication, configService: ConfigService) {
  const frontendOrigin = configService.get<string>('FRONTEND_ORIGIN');

  app.enableCors({
    origin: frontendOrigin ?? true,
  });
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

function getBaseUrl(port: number, configService: ConfigService) {
  const apiPrefix = configService.get<string>('API_PREFIX');
  const rootUrl = `http://localhost:${port}`;

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
