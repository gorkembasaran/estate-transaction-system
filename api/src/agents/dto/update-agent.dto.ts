import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateAgentDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
