import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AgentsService } from './agents.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';

type AgentModelMock = {
  countDocuments: jest.Mock;
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
  findByIdAndUpdate: jest.Mock;
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
      countDocuments: jest.fn(),
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
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

  it('returns agents sorted by newest first', async () => {
    const agents = [
      createAgentMock({
        _id: agentId,
        ...createAgentDto,
      }),
    ];
    const query = createFindQuery(agents);
    const countQuery = createCountQuery(1);
    agentModel.find.mockReturnValue(query);
    agentModel.countDocuments.mockReturnValue(countQuery);

    const result = await service.getAllAgents({ page: 1, limit: 10 });

    expect(agentModel.find).toHaveBeenCalledWith({});
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    expect(query.skip).toHaveBeenCalledWith(0);
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.exec).toHaveBeenCalledTimes(1);
    expect(agentModel.countDocuments).toHaveBeenCalledWith({});
    expect(countQuery.exec).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      items: agents,
      meta: {
        hasNextPage: false,
        hasPreviousPage: false,
        limit: 10,
        page: 1,
        totalItems: 1,
        totalPages: 1,
      },
    });
  });

  it('returns an empty page when no agents exist', async () => {
    const query = createFindQuery([]);
    const countQuery = createCountQuery(0);
    agentModel.find.mockReturnValue(query);
    agentModel.countDocuments.mockReturnValue(countQuery);

    await expect(service.getAllAgents({ page: 1, limit: 10 })).resolves.toEqual({
      items: [],
      meta: {
        hasNextPage: false,
        hasPreviousPage: false,
        limit: 10,
        page: 1,
        totalItems: 0,
        totalPages: 0,
      },
    });

    expect(agentModel.find).toHaveBeenCalledWith({});
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    expect(query.skip).toHaveBeenCalledWith(0);
    expect(query.limit).toHaveBeenCalledWith(10);
    expect(query.exec).toHaveBeenCalledTimes(1);
    expect(countQuery.exec).toHaveBeenCalledTimes(1);
  });

  it('filters agents by search text', async () => {
    const agents = [
      createAgentMock({
        _id: agentId,
        ...createAgentDto,
      }),
    ];
    const query = createFindQuery(agents);
    const countQuery = createCountQuery(1);
    agentModel.find.mockReturnValue(query);
    agentModel.countDocuments.mockReturnValue(countQuery);

    await service.getAllAgents({ page: 2, limit: 5, search: 'gorkem' });

    expect(agentModel.find).toHaveBeenCalledWith({
      $or: [
        { fullName: expect.any(RegExp) },
        { email: expect.any(RegExp) },
      ],
    });
    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.limit).toHaveBeenCalledWith(5);
  });

  it('filters active agents when status is active', async () => {
    const query = createFindQuery([]);
    const countQuery = createCountQuery(0);
    agentModel.find.mockReturnValue(query);
    agentModel.countDocuments.mockReturnValue(countQuery);

    await service.getAllAgents({ page: 1, limit: 10, status: 'active' });

    expect(agentModel.find).toHaveBeenCalledWith({ isActive: true });
    expect(agentModel.countDocuments).toHaveBeenCalledWith({ isActive: true });
  });

  it('filters inactive agents when status is inactive', async () => {
    const query = createFindQuery([]);
    const countQuery = createCountQuery(0);
    agentModel.find.mockReturnValue(query);
    agentModel.countDocuments.mockReturnValue(countQuery);

    await service.getAllAgents({ page: 1, limit: 10, status: 'inactive' });

    expect(agentModel.find).toHaveBeenCalledWith({ isActive: false });
    expect(agentModel.countDocuments).toHaveBeenCalledWith({ isActive: false });
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

  it('updates an agent successfully', async () => {
    const updateAgentDto: UpdateAgentDto = {
      email: 'updated@example.com',
      fullName: 'Updated Agent',
      isActive: true,
    };
    const updatedAgent = createAgentMock({
      _id: agentId,
      email: updateAgentDto.email,
      fullName: updateAgentDto.fullName,
      isActive: updateAgentDto.isActive,
    });
    const query = createFindByIdQuery(updatedAgent);
    agentModel.findByIdAndUpdate.mockReturnValue(query);

    const result = await service.updateAgent(agentId, updateAgentDto);

    expect(agentModel.findByIdAndUpdate).toHaveBeenCalledWith(
      agentId,
      updateAgentDto,
      {
        new: true,
        runValidators: true,
      },
    );
    expect(query.exec).toHaveBeenCalledTimes(1);
    expect(result).toBe(updatedAgent);
  });

  it('throws BadRequestException when updating with an invalid agent id', async () => {
    await expect(
      service.updateAgent('invalid-id', { fullName: 'Updated Agent' }),
    ).rejects.toThrow(BadRequestException);

    expect(agentModel.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when updating a missing agent', async () => {
    const query = createFindByIdQuery(null);
    agentModel.findByIdAndUpdate.mockReturnValue(query);

    await expect(
      service.updateAgent(agentId, { fullName: 'Updated Agent' }),
    ).rejects.toThrow(NotFoundException);

    expect(query.exec).toHaveBeenCalledTimes(1);
  });

  it('throws ConflictException when updating to an existing email', async () => {
    agentModel.findByIdAndUpdate.mockReturnValue({
      exec: jest.fn().mockRejectedValue({ code: 11000 }),
    });

    await expect(
      service.updateAgent(agentId, { email: 'taken@example.com' }),
    ).rejects.toThrow(ConflictException);
  });
});

function createFindQuery(result: unknown) {
  return {
    exec: jest.fn().mockResolvedValue(result),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
  };
}

function createCountQuery(result: number) {
  return {
    exec: jest.fn().mockResolvedValue(result),
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
