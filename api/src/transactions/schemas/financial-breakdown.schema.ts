import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

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
