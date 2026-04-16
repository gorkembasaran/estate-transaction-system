import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.getOrThrow<string>('NODE_ENV');

        return {
          autoIndex: nodeEnv !== 'production',
          dbName: configService.getOrThrow<string>('MONGODB_DATABASE'),
          serverSelectionTimeoutMS: 5000,
          uri: configService.getOrThrow<string>('MONGODB_URI'),
        };
      },
    }),
  ],
})
export class DatabaseModule {}
