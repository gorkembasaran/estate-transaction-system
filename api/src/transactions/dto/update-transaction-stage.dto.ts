import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { TRANSACTION_STAGES } from '../enums/transaction-stage.enum';
import type { TransactionStage } from '../enums/transaction-stage.enum';

export class UpdateTransactionStageDto {
  @ApiProperty({ enum: TRANSACTION_STAGES, example: 'earnest_money' })
  @IsIn(TRANSACTION_STAGES)
  stage: TransactionStage;
}
