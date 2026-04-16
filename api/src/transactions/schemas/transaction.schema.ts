import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TRANSACTION_STAGES } from '../enums/transaction-stage.enum';
import type { TransactionStage } from '../enums/transaction-stage.enum';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ _id: false })
export class FinancialBreakdown {
  @Prop({ required: true, min: 0 })
  agencyAmount: number;

  @Prop({ required: true, min: 0 })
  listingAgentAmount: number;

  @Prop({ required: true, min: 0 })
  sellingAgentAmount: number;

  @Prop({ required: true, trim: true })
  listingAgentReason: string;

  @Prop({ required: true, trim: true })
  sellingAgentReason: string;

  @Prop({ default: Date.now, required: true })
  calculatedAt: Date;
}

export const FinancialBreakdownSchema =
  SchemaFactory.createForClass(FinancialBreakdown);

@Schema({ _id: false })
export class StageHistoryItem {
  @Prop({
    default: null,
    enum: TRANSACTION_STAGES,
    type: String,
  })
  fromStage: TransactionStage | null;

  @Prop({
    enum: TRANSACTION_STAGES,
    required: true,
    type: String,
  })
  toStage: TransactionStage;

  @Prop({ default: Date.now, required: true })
  changedAt: Date;
}

export const StageHistoryItemSchema =
  SchemaFactory.createForClass(StageHistoryItem);

@Schema({
  collection: 'transactions',
  timestamps: true,
})
export class Transaction {
  _id: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  propertyTitle: string;

  @Prop({
    min: 0.01,
    required: true,
  })
  totalServiceFee: number;

  @Prop({
    required: true,
    trim: true,
    uppercase: true,
  })
  currency: string;

  @Prop({
    ref: 'Agent',
    required: true,
    type: Types.ObjectId,
  })
  listingAgentId: Types.ObjectId;

  @Prop({
    ref: 'Agent',
    required: true,
    type: Types.ObjectId,
  })
  sellingAgentId: Types.ObjectId;

  @Prop({
    default: 'agreement',
    enum: TRANSACTION_STAGES,
    required: true,
    type: String,
  })
  stage: TransactionStage;

  @Prop({
    default: null,
    type: FinancialBreakdownSchema,
  })
  breakdown: FinancialBreakdown | null;

  @Prop({
    default: [],
    type: [StageHistoryItemSchema],
  })
  stageHistory: StageHistoryItem[];

  createdAt: Date;

  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

TransactionSchema.index({ stage: 1, createdAt: -1 });
TransactionSchema.index({ listingAgentId: 1 });
TransactionSchema.index({ sellingAgentId: 1 });
