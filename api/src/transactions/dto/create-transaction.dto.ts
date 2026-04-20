import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'Luxury Penthouse Downtown' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  propertyTitle: string;

  @ApiProperty({ example: 45000, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  totalServiceFee: number;

  @ApiProperty({ example: 'USD', maxLength: 3, minLength: 3 })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @Length(3, 3)
  @IsUppercase()
  currency: string;

  @ApiProperty({ example: '6621b40c4d6d9f0012f0a111' })
  @IsMongoId()
  listingAgentId: string;

  @ApiProperty({ example: '6621b40c4d6d9f0012f0a222' })
  @IsMongoId()
  sellingAgentId: string;
}
