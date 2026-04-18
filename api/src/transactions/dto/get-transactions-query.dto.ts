import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TRANSACTION_STAGES } from '../enums/transaction-stage.enum';
import type { TransactionStage } from '../enums/transaction-stage.enum';

export class GetTransactionsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @IsIn(TRANSACTION_STAGES)
  @IsOptional()
  stage?: TransactionStage;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  search?: string;
}
