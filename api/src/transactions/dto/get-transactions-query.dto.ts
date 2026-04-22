import { ApiPropertyOptional } from '@nestjs/swagger';
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
import { trimString, trimStringToUndefined } from '../../common/utils';
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
  @ApiPropertyOptional({ default: 1, example: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, example: 10, maximum: 100, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ enum: TRANSACTION_STAGES, example: 'completed' })
  @IsIn(TRANSACTION_STAGES)
  @IsOptional()
  stage?: TransactionStage;

  @ApiPropertyOptional({
    description: 'Case-insensitive search by property title or currency.',
    example: 'penthouse',
  })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Inclusive createdAt start date filter.',
    example: '2026-04-01',
  })
  @Transform(({ value }: { value: unknown }) => trimStringToUndefined(value))
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'Inclusive createdAt end date filter.',
    example: '2026-04-30',
  })
  @Transform(({ value }: { value: unknown }) => trimStringToUndefined(value))
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({
    default: 'updatedAt',
    enum: TRANSACTION_SORT_FIELDS,
    example: 'updatedAt',
  })
  @IsIn(TRANSACTION_SORT_FIELDS)
  @IsOptional()
  sortBy?: TransactionSortField = 'updatedAt';

  @ApiPropertyOptional({
    default: 'desc',
    enum: SORT_ORDERS,
    example: 'desc',
  })
  @IsIn(SORT_ORDERS)
  @IsOptional()
  sortOrder?: SortOrder = 'desc';
}
