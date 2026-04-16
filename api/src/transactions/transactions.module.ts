import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AgentsModule } from '../agents/agents.module';
import { CommissionService } from './commission.service';
import { StageTransitionService } from './stage-transition.service';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

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
