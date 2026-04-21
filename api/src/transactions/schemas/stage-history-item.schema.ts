import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TRANSACTION_STAGES } from '../enums/transaction-stage.enum';
import type { TransactionStage } from '../enums/transaction-stage.enum';

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
