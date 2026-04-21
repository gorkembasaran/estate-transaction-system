import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AgentDocument = HydratedDocument<Agent>;

@Schema({
  collection: 'agents',
  timestamps: true,
})
export class Agent {
  _id: Types.ObjectId;

  @Prop({
    minlength: 2,
    required: true,
    trim: true,
  })
  fullName: string;

  @Prop({
    lowercase: true,
    required: true,
    trim: true,
  })
  email: string;

  @Prop({
    default: true,
    required: true,
  })
  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;
}

export const AgentSchema = SchemaFactory.createForClass(Agent);

AgentSchema.index({ email: 1 }, { unique: true });
