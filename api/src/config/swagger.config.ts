import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function configureSwagger(app: INestApplication) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Estate Transaction API')
    .setDescription(
      'REST API for managing estate agents, transactions, lifecycle transitions, and commission breakdowns.',
    )
    .setVersion('1.0')
    .addTag('Agents')
    .addTag('Transactions')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Estate Transaction API Docs',
    jsonDocumentUrl: 'docs-json',
  });
}
