import { Types } from 'mongoose';
import {
  FinancialBreakdown,
  StageHistoryItem,
  TransactionStage,
} from '../schemas/transaction.schema';

export class TransactionResponseDto {
  _id: Types.ObjectId;
  propertyTitle: string;
  totalServiceFee: number;
  currency: string;
  listingAgentId: Types.ObjectId;
  sellingAgentId: Types.ObjectId;
  stage: TransactionStage;
  breakdown: FinancialBreakdown | null;
  stageHistory: StageHistoryItem[];
  createdAt: Date;
  updatedAt: Date;
}
