import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const AGENT_STATUS_FILTERS = ['all', 'active', 'inactive'] as const;

export type AgentStatusFilter = (typeof AGENT_STATUS_FILTERS)[number];

export class GetAgentsQueryDto {
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

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  search?: string;

  @IsIn(AGENT_STATUS_FILTERS)
  @IsOptional()
  status?: AgentStatusFilter = 'all';
}
