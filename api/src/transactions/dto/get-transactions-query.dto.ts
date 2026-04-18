import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TRANSACTION_STAGES } from '../enums/transaction-stage.enum';
import type { TransactionStage } from '../enums/transaction-stage.enum';

export const TRANSACTION_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'totalServiceFee',
] as const;
export const SORT_ORDERS = ['asc', 'desc'] as const;

export type TransactionSortField = (typeof TRANSACTION_SORT_FIELDS)[number];
export type SortOrder = (typeof SORT_ORDERS)[number];

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

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() || undefined : value,
  )
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsIn(TRANSACTION_SORT_FIELDS)
  @IsOptional()
  sortBy?: TransactionSortField = 'updatedAt';

  @IsIn(SORT_ORDERS)
  @IsOptional()
  sortOrder?: SortOrder = 'desc';
}
