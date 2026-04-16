import {
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TRANSACTION_STAGES } from '../schemas/transaction.schema';
import type { TransactionStage } from '../schemas/transaction.schema';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  propertyTitle: string;

  @IsNumber()
  @Min(0)
  totalServiceFee: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsMongoId()
  listingAgentId: string;

  @IsMongoId()
  sellingAgentId: string;

  @IsIn(TRANSACTION_STAGES)
  @IsOptional()
  stage?: TransactionStage;
}
