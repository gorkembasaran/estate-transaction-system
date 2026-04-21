import type { INestApplication } from '@nestjs/common';

export function configureGlobalPrefix(
  app: INestApplication,
  apiPrefix?: string,
) {
  if (apiPrefix) {
    app.setGlobalPrefix(apiPrefix);
  }
}
