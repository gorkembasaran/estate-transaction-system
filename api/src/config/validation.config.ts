import {
  BadRequestException,
  type INestApplication,
  type ValidationError,
  ValidationPipe,
} from '@nestjs/common';

export function configureValidation(app: INestApplication) {
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
