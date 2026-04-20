import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';

export class AgentResponseDto {
  @ApiProperty({ example: '6621b40c4d6d9f0012f0a111' })
  _id: string;

  @ApiProperty({ example: 'Sarah Johnson' })
  fullName: string;

  @ApiProperty({ example: 'sarah.johnson@example.com' })
  email: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-04-18T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-04-18T12:00:00.000Z' })
  updatedAt: string;
}

export class PaginatedAgentsResponseDto {
  @ApiProperty({ type: [AgentResponseDto] })
  items: AgentResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
