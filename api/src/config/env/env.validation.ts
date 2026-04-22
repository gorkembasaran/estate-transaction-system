export const DEFAULT_DATABASE_NAME = 'estate_transaction_system';
export const LOCAL_MONGODB_URI = 'mongodb://127.0.0.1:27017';

type NodeEnvironment = 'development' | 'test' | 'production';

interface ValidatedEnvironment {
  API_PREFIX?: string;
  FRONTEND_ORIGIN?: string;
  HOST: string;
  MONGODB_DATABASE: string;
  MONGODB_URI: string;
  NODE_ENV: NodeEnvironment;
  PORT: number;
}

export function validateEnvironment(
  config: Record<string, unknown>,
): ValidatedEnvironment {
  const nodeEnv = parseNodeEnvironment(config.NODE_ENV);
  const mongodbUri = parseOptionalString(config.MONGODB_URI);

  if (nodeEnv === 'production' && !mongodbUri) {
    throw new Error('MONGODB_URI must be set in production.');
  }

  return {
    API_PREFIX: parseApiPrefix(config.API_PREFIX),
    FRONTEND_ORIGIN: parseOptionalString(config.FRONTEND_ORIGIN),
    HOST: parseOptionalString(config.HOST) ?? '0.0.0.0',
    MONGODB_DATABASE:
      parseOptionalString(config.MONGODB_DATABASE) ?? DEFAULT_DATABASE_NAME,
    MONGODB_URI: mongodbUri ?? LOCAL_MONGODB_URI,
    NODE_ENV: nodeEnv,
    PORT: parsePort(config.PORT),
  };
}

function parseNodeEnvironment(value: unknown): NodeEnvironment {
  const nodeEnv = parseOptionalString(value) ?? 'development';
  const allowedEnvironments: NodeEnvironment[] = [
    'development',
    'test',
    'production',
  ];

  if (!allowedEnvironments.includes(nodeEnv as NodeEnvironment)) {
    throw new Error(
      `NODE_ENV must be one of: ${allowedEnvironments.join(', ')}`,
    );
  }

  return nodeEnv as NodeEnvironment;
}

function parsePort(value: unknown) {
  const rawPort = parseOptionalString(value) ?? '3001';
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port between 1 and 65535.');
  }

  return port;
}

function parseApiPrefix(value: unknown) {
  const prefix = parseOptionalString(value);

  if (!prefix) {
    return undefined;
  }

  return prefix.replace(/^\/+|\/+$/g, '');
}

function parseOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}
