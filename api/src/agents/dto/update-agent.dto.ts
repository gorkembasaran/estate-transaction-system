import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { trimLowercaseString, trimString } from '../../common/utils';

export class UpdateAgentDto {
  @ApiPropertyOptional({ example: 'Sarah Johnson', minLength: 2 })
  @Transform(({ value }: { value: unknown }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 'sarah.johnson@example.com' })
  @Transform(({ value }: { value: unknown }) => trimLowercaseString(value))
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
