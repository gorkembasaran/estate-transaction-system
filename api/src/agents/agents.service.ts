import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateAgentDto } from './dto/create-agent.dto';
import { GetAgentsQueryDto } from './dto/get-agents-query.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { Agent, AgentDocument } from './schemas/agent.schema';

type AgentListFilter = {
  $or?: Array<{ email: RegExp } | { fullName: RegExp }>;
  isActive?: boolean;
};

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

  async getAllAgents(query: GetAgentsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const filter = this.buildAgentFilter(query);

    const [items, totalItems] = await Promise.all([
      this.agentModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.agentModel.countDocuments(filter).exec(),
    ]);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      meta: {
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1 && totalItems > 0,
        limit,
        page,
        totalItems,
        totalPages,
      },
    };
  }

  async getAgentById(id: string) {
    this.assertValidObjectId(id);

    const agent = await this.agentModel.findById(id).exec();

    if (!agent) {
      throw new NotFoundException(`Agent with id "${id}" was not found`);
    }

    return agent;
  }

  async updateAgent(id: string, updateAgentDto: UpdateAgentDto) {
    this.assertValidObjectId(id);

    try {
      const agent = await this.agentModel
        .findByIdAndUpdate(id, updateAgentDto, {
          new: true,
          runValidators: true,
        })
        .exec();

      if (!agent) {
        throw new NotFoundException(`Agent with id "${id}" was not found`);
      }

      return agent;
    } catch (error) {
      if (this.isDuplicateEmailError(error) && updateAgentDto.email) {
        throw new ConflictException(
          `Agent with email "${updateAgentDto.email}" already exists`,
        );
      }

      throw error;
    }
  }

  async validateAgentExists(id: string) {
    await this.getAgentById(id);
  }

  private buildAgentFilter(query: GetAgentsQueryDto): AgentListFilter {
    const filter: AgentListFilter = {};

    if (query.status === 'active') {
      filter.isActive = true;
    }

    if (query.status === 'inactive') {
      filter.isActive = false;
    }

    if (query.search) {
      const searchPattern = new RegExp(escapeRegex(query.search), 'i');

      filter.$or = [
        { fullName: searchPattern },
        { email: searchPattern },
      ];
    }

    return filter;
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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
