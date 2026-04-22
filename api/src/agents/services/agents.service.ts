import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { createPaginationMeta } from '../../common/pagination';
import { CreateAgentDto } from '../dto/create-agent.dto';
import { GetAgentsQueryDto } from '../dto/get-agents-query.dto';
import { UpdateAgentDto } from '../dto/update-agent.dto';
import { buildAgentListQuery } from '../query';
import { Agent } from '../schemas';
import type { AgentDocument } from '../schemas';
import { isMongoDuplicateKeyError } from '../utils';

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
      if (isMongoDuplicateKeyError(error)) {
        throw new ConflictException(
          `Agent with email "${createAgentDto.email}" already exists`,
        );
      }

      throw error;
    }
  }

  async getAllAgents(query: GetAgentsQueryDto) {
    const { filter, limit, page, skip, sort } = buildAgentListQuery(query);

    const [items, totalItems] = await Promise.all([
      this.agentModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      this.agentModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      meta: createPaginationMeta({ limit, page, totalItems }),
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
          returnDocument: 'after',
          runValidators: true,
        })
        .exec();

      if (!agent) {
        throw new NotFoundException(`Agent with id "${id}" was not found`);
      }

      return agent;
    } catch (error) {
      if (isMongoDuplicateKeyError(error) && updateAgentDto.email) {
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

  private assertValidObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid agent id: "${id}"`);
    }
  }
}
