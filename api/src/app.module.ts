import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';
import { validateEnvironment } from './config/env';
import { DatabaseModule } from './database/database.module';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: ['.env.local', '.env'],
      isGlobal: true,
      validate: validateEnvironment,
    }),
    DatabaseModule,
    AgentsModule,
    TransactionsModule,
  ],
})
export class AppModule {}
