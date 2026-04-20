import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const AGENT_STATUS_FILTERS = ['all', 'active', 'inactive'] as const;

export type AgentStatusFilter = (typeof AGENT_STATUS_FILTERS)[number];

export class GetAgentsQueryDto {
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

  @ApiPropertyOptional({
    description: 'Case-insensitive search by full name or email.',
    example: 'sarah',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    default: 'all',
    enum: AGENT_STATUS_FILTERS,
    example: 'active',
  })
  @IsIn(AGENT_STATUS_FILTERS)
  @IsOptional()
  status?: AgentStatusFilter = 'all';
}
