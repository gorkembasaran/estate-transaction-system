import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AgentDocument = HydratedDocument<Agent>;

@Schema({
  collection: 'agents',
  timestamps: true,
})
export class Agent {
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
}

export const AgentSchema = SchemaFactory.createForClass(Agent);

AgentSchema.index({ email: 1 }, { unique: true });
