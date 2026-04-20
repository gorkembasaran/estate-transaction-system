import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { AgentResponseDto } from '../../agents/dto/agent-response.dto';
import { PaginationMetaDto } from '../../common/dto/pagination-meta.dto';
import { TRANSACTION_STAGES } from '../enums/transaction-stage.enum';
import type { TransactionStage } from '../enums/transaction-stage.enum';

export class TransactionAgentSummaryDto {
  @ApiProperty({ example: '6621b40c4d6d9f0012f0a111' })
  _id: string;

  @ApiProperty({ example: 'Sarah Johnson' })
  fullName: string;

  @ApiProperty({ example: 'sarah.johnson@example.com' })
  email: string;
}

export class StageHistoryItemResponseDto {
  @ApiPropertyOptional({
    enum: TRANSACTION_STAGES,
    example: null,
    nullable: true,
  })
  fromStage: TransactionStage | null;

  @ApiProperty({ enum: TRANSACTION_STAGES, example: 'agreement' })
  toStage: TransactionStage;

  @ApiProperty({ example: '2026-04-18T12:00:00.000Z' })
  changedAt: string;
}

export class FinancialBreakdownResponseDto {
  @ApiProperty({ example: 22500 })
  agencyAmount: number;

  @ApiProperty({ example: 11250 })
  listingAgentAmount: number;

  @ApiProperty({ example: 11250 })
  sellingAgentAmount: number;

  @ApiProperty({
    example:
      'Listing agent receives half of the agent portion because the listing and selling agents are different.',
  })
  listingAgentReason: string;

  @ApiProperty({
    example:
      'Selling agent receives half of the agent portion because the listing and selling agents are different.',
  })
  sellingAgentReason: string;

  @ApiProperty({ example: '2026-04-18T12:00:00.000Z' })
  calculatedAt: string;
}

export class TransactionResponseDto {
  @ApiProperty({ example: '6621b40c4d6d9f0012f0b222' })
  _id: string;

  @ApiProperty({ example: 'Luxury Penthouse Downtown' })
  propertyTitle: string;

  @ApiProperty({ example: 45000 })
  totalServiceFee: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: '6621b40c4d6d9f0012f0a111' },
      { $ref: getSchemaPath(TransactionAgentSummaryDto) },
    ],
  })
  listingAgentId: string | TransactionAgentSummaryDto;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: '6621b40c4d6d9f0012f0a222' },
      { $ref: getSchemaPath(TransactionAgentSummaryDto) },
    ],
  })
  sellingAgentId: string | TransactionAgentSummaryDto;

  @ApiProperty({ enum: TRANSACTION_STAGES, example: 'agreement' })
  stage: TransactionStage;

  @ApiProperty({
    allOf: [{ $ref: getSchemaPath(FinancialBreakdownResponseDto) }],
    nullable: true,
  })
  breakdown: FinancialBreakdownResponseDto | null;

  @ApiProperty({ type: [StageHistoryItemResponseDto] })
  stageHistory: StageHistoryItemResponseDto[];

  @ApiProperty({ example: '2026-04-18T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2026-04-18T12:00:00.000Z' })
  updatedAt: string;
}

export class PaginatedTransactionsResponseDto {
  @ApiProperty({ type: [TransactionResponseDto] })
  items: TransactionResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export const TRANSACTION_RESPONSE_EXTRA_MODELS = [
  AgentResponseDto,
  TransactionAgentSummaryDto,
  FinancialBreakdownResponseDto,
  StageHistoryItemResponseDto,
];
