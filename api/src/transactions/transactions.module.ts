import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentsModule } from '../agents/agents.module';
import { TransactionsController } from './controllers';
import { Transaction, TransactionSchema } from './schemas';
import {
  CommissionService,
  StageTransitionService,
  TransactionsService,
} from './services';

@Module({
  imports: [
    AgentsModule,
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, CommissionService, StageTransitionService],
  exports: [TransactionsService, CommissionService, StageTransitionService],
})
export class TransactionsModule {}
