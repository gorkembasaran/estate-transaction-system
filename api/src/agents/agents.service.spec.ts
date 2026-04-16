import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';

type AgentModelMock = {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
};

describe('AgentsService', () => {
  const agentId = new Types.ObjectId().toString();

  let agentModel: AgentModelMock;
  let service: AgentsService;

  const createAgentDto: CreateAgentDto = {
    fullName: 'Gorkem Basaran',
    email: 'gorkem@example.com',
    isActive: true,
  };

  beforeEach(() => {
    agentModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };

    service = new AgentsService(agentModel as never);
  });

  it('creates an agent successfully', async () => {
    const createdAgent = createAgentMock({
      _id: agentId,
      ...createAgentDto,
    });
    agentModel.create.mockResolvedValue(createdAgent);

    const result = await service.createAgent(createAgentDto);

    expect(agentModel.create).toHaveBeenCalledWith(createAgentDto);
    expect(result).toBe(createdAgent);
  });

  it('throws ConflictException when email already exists', async () => {
    agentModel.create.mockRejectedValue({ code: 11000 });

    try {
      await service.createAgent(createAgentDto);
      fail('Expected createAgent to throw ConflictException');
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect((error as Error).message).toContain(
        `Agent with email "${createAgentDto.email}" already exists`,
      );
    }
  });

  it('rethrows unknown create errors', async () => {
    const databaseError = new Error('Database unavailable');
    agentModel.create.mockRejectedValue(databaseError);

    await expect(service.createAgent(createAgentDto)).rejects.toBe(
      databaseError,
    );
  });

  it('returns active agents sorted by newest first', async () => {
    const agents = [
      createAgentMock({
        _id: agentId,
        ...createAgentDto,
      }),
    ];
    const query = createFindQuery(agents);
    agentModel.find.mockReturnValue(query);

    const result = await service.getAllAgents();

    expect(agentModel.find).toHaveBeenCalledWith({ isActive: true });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.exec).toHaveBeenCalledTimes(1);
    expect(result).toBe(agents);
  });

  it('returns an empty array when no active agents exist', async () => {
    const query = createFindQuery([]);
    agentModel.find.mockReturnValue(query);

    await expect(service.getAllAgents()).resolves.toEqual([]);

    expect(agentModel.find).toHaveBeenCalledWith({ isActive: true });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(query.exec).toHaveBeenCalledTimes(1);
  });

  it('throws BadRequestException when agent id is invalid', async () => {
    await expect(service.getAgentById('invalid-id')).rejects.toThrow(
      BadRequestException,
    );

    expect(agentModel.findById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when agent does not exist', async () => {
    const query = createFindByIdQuery(null);
    agentModel.findById.mockReturnValue(query);

    await expect(service.getAgentById(agentId)).rejects.toThrow(
      NotFoundException,
    );

    expect(query.exec).toHaveBeenCalledTimes(1);
  });

  it('returns agent when found by id', async () => {
    const agent = createAgentMock({
      _id: agentId,
      ...createAgentDto,
    });
    const query = createFindByIdQuery(agent);
    agentModel.findById.mockReturnValue(query);

    const result = await service.getAgentById(agentId);

    expect(agentModel.findById).toHaveBeenCalledWith(agentId);
    expect(query.exec).toHaveBeenCalledTimes(1);
    expect(result).toBe(agent);
  });

  it('resolves validateAgentExists when agent exists', async () => {
    const agent = createAgentMock({
      _id: agentId,
      ...createAgentDto,
    });
    const query = createFindByIdQuery(agent);
    agentModel.findById.mockReturnValue(query);

    await expect(service.validateAgentExists(agentId)).resolves.toBeUndefined();

    expect(agentModel.findById).toHaveBeenCalledWith(agentId);
    expect(query.exec).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException from validateAgentExists when agent does not exist', async () => {
    const query = createFindByIdQuery(null);
    agentModel.findById.mockReturnValue(query);

    await expect(service.validateAgentExists(agentId)).rejects.toThrow(
      NotFoundException,
    );

    expect(query.exec).toHaveBeenCalledTimes(1);
  });
});

function createFindQuery(result: unknown) {
  return {
    exec: jest.fn().mockResolvedValue(result),
    sort: jest.fn().mockReturnThis(),
  };
}

function createFindByIdQuery(result: unknown) {
  return {
    exec: jest.fn().mockResolvedValue(result),
  };
}

function createAgentMock({
  _id,
  email,
  fullName,
  isActive = true,
}: {
  _id: string;
  email: string;
  fullName: string;
  isActive?: boolean;
}) {
  return {
    _id,
    email,
    fullName,
    isActive,
    createdAt: new Date('2026-04-16T12:00:00.000Z'),
    updatedAt: new Date('2026-04-16T12:00:00.000Z'),
  };
}
