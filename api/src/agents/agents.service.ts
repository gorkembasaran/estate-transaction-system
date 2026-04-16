import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async createAgent(createAgentDto: CreateAgentDto) {
    try {
      return await this.agentModel.create(createAgentDto);
    } catch (error) {
      if (this.isDuplicateEmailError(error)) {
        throw new ConflictException(
          `Agent with email "${createAgentDto.email}" already exists`,
        );
      }

      throw error;
    }
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
      throw new BadRequestException(`Invalid agent id: "${id}"`);
    }
  }

  private isDuplicateEmailError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 11000
    );
  }
}
