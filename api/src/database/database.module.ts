import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

const DEFAULT_DATABASE_NAME = 'estate_transaction_system';
const LOCAL_MONGODB_URI = `mongodb://127.0.0.1:27017/${DEFAULT_DATABASE_NAME}`;

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
        const configuredUri = configService.get<string>('MONGODB_URI');

        if (nodeEnv === 'production' && !configuredUri) {
          throw new Error('MONGODB_URI must be set in production.');
        }

        return {
          uri: configuredUri ?? LOCAL_MONGODB_URI,
          dbName:
            configService.get<string>('MONGODB_DATABASE') ??
            DEFAULT_DATABASE_NAME,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
