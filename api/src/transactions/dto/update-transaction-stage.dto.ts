import { IsIn } from 'class-validator';
import { TRANSACTION_STAGES } from '../schemas/transaction.schema';
import type { TransactionStage } from '../schemas/transaction.schema';

export class UpdateTransactionStageDto {
  @IsIn(TRANSACTION_STAGES)
  stage: TransactionStage;
}
