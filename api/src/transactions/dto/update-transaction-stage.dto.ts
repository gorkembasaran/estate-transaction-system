import { IsIn } from 'class-validator';
import { TRANSACTION_STAGES } from '../enums/transaction-stage.enum';
import type { TransactionStage } from '../enums/transaction-stage.enum';

export class UpdateTransactionStageDto {
  @IsIn(TRANSACTION_STAGES)
  stage: TransactionStage;
}
