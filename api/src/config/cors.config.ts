import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

const DEVELOPMENT_FRONTEND_ORIGINS = [
  'http://127.0.0.1:3001',
  'http://localhost:3001',
];

export function configureCors(
  app: INestApplication,
  configService: ConfigService,
) {
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

  return Array.from(
    new Set([...configuredOrigins, ...DEVELOPMENT_FRONTEND_ORIGINS]),
  );
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
