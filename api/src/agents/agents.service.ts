import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAgentDto } from './dto/create-agent.dto';
import { Agent, AgentDocument } from './schemas/agent.schema';

@Injectable()
export class AgentsService {
  constructor(
    @InjectModel(Agent.name)
    private readonly agentModel: Model<AgentDocument>,
  ) {}

  createAgent(createAgentDto: CreateAgentDto) {
    return this.agentModel.create(createAgentDto);
  }

  getAllAgents() {
    return this.agentModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAgentById(id: string) {
    this.assertValidObjectId(id);

    const agent = await this.agentModel.findById(id).exec();

    if (!agent) {
      throw new NotFoundException(`Agent with id "${id}" was not found`);
    }

    return agent;
  }

  async validateAgentExists(id: string) {
    await this.getAgentById(id);
  }

  private assertValidObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Agent with id "${id}" was not found`);
    }
  }
}
