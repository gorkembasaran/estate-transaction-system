import { Transform, Type } from 'class-transformer';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUppercase,
  Length,
  Min,
} from 'class-validator';

export class CreateTransactionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  propertyTitle: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  totalServiceFee: number;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  @IsUppercase()
  currency: string;

  @IsMongoId()
  listingAgentId: string;

  @IsMongoId()
  sellingAgentId: string;
}
