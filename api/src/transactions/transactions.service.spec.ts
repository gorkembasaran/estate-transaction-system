import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AgentsService } from '../agents/agents.service';
import { CommissionService } from './commission.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { FinancialBreakdown } from './schemas/transaction.schema';
import { StageTransitionService } from './stage-transition.service';
import { TransactionsService } from './transactions.service';

type TransactionModelMock = {
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
};

type AgentServiceMock = Pick<AgentsService, 'validateAgentExists'>;
type CommissionServiceMock = Pick<CommissionService, 'calculate'>;
type StageTransitionServiceMock = Pick<
  StageTransitionService,
  'assertCanTransition' | 'createHistoryItem' | 'isFinalStage'
>;

describe('TransactionsService', () => {
  const listingAgentId = new Types.ObjectId().toString();
  const sellingAgentId = new Types.ObjectId().toString();
  const transactionId = new Types.ObjectId().toString();

  let transactionModel: TransactionModelMock;
  let agentsService: jest.Mocked<AgentServiceMock>;
  let commissionService: jest.Mocked<CommissionServiceMock>;
  let stageTransitionService: jest.Mocked<StageTransitionServiceMock>;
  let service: TransactionsService;

  const createTransactionDto: CreateTransactionDto = {
    propertyTitle: 'Bebek Residence',
    totalServiceFee: 1000,
    currency: 'TRY',
    listingAgentId,
    sellingAgentId,
  };

  beforeEach(() => {
    transactionModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
    };
    agentsService = {
      validateAgentExists: jest.fn().mockResolvedValue(undefined),
    };
    commissionService = {
      calculate: jest.fn(),
    };
    stageTransitionService = {
      assertCanTransition: jest.fn(),
      createHistoryItem: jest.fn().mockReturnValue({
        fromStage: null,
        toStage: 'agreement',
        changedAt: new Date('2026-04-16T12:00:00.000Z'),
      }),
      isFinalStage: jest.fn().mockReturnValue(false),
    };

    service = new TransactionsService(
      transactionModel as never,
      agentsService as never,
      commissionService as never,
      stageTransitionService as never,
    );
  });

  it('validates listing and selling agents before creating a transaction', async () => {
    transactionModel.create.mockResolvedValue({ _id: transactionId });

    await service.createTransaction(createTransactionDto);

    expect(agentsService.validateAgentExists).toHaveBeenCalledTimes(2);
    expect(agentsService.validateAgentExists).toHaveBeenCalledWith(
      listingAgentId,
    );
    expect(agentsService.validateAgentExists).toHaveBeenCalledWith(
      sellingAgentId,
    );
  });

  it('starts every created transaction in agreement stage', async () => {
    transactionModel.create.mockImplementation(async (payload) => payload);

    const transaction = await service.createTransaction(createTransactionDto);

    expect(transaction).toMatchObject({
      stage: 'agreement',
      breakdown: null,
    });
    expect(transactionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'agreement',
        breakdown: null,
      }),
    );
  });

  it('adds an initial stage history item when creating a transaction', async () => {
    const historyItem = {
      fromStage: null,
      toStage: 'agreement',
      changedAt: new Date('2026-04-16T12:00:00.000Z'),
    };
    stageTransitionService.createHistoryItem.mockReturnValue(historyItem);
    transactionModel.create.mockImplementation(async (payload) => payload);

    const transaction = await service.createTransaction(createTransactionDto);

    expect(stageTransitionService.createHistoryItem).toHaveBeenCalledWith(
      null,
      'agreement',
    );
    expect(transaction.stageHistory).toEqual([historyItem]);
  });

  it('calculates and stores breakdown when a transaction reaches completed stage', async () => {
    const breakdown: FinancialBreakdown = {
      agencyAmount: 500,
      listingAgentAmount: 250,
      sellingAgentAmount: 250,
      listingAgentReason: 'listing reason',
      sellingAgentReason: 'selling reason',
      calculatedAt: new Date('2026-04-16T12:00:00.000Z'),
    };
    const transaction = createTransactionDocumentMock({
      stage: 'title_deed',
      totalServiceFee: 1000,
      listingAgentId,
      sellingAgentId,
    });

    transactionModel.findById.mockReturnValue(createFindByIdQuery(transaction));
    stageTransitionService.createHistoryItem.mockReturnValue({
      fromStage: 'title_deed',
      toStage: 'completed',
      changedAt: new Date('2026-04-16T13:00:00.000Z'),
    });
    stageTransitionService.isFinalStage.mockReturnValue(true);
    commissionService.calculate.mockReturnValue(breakdown);

    const result = await service.updateTransactionStage(transactionId, {
      stage: 'completed',
    });

    expect(stageTransitionService.assertCanTransition).toHaveBeenCalledWith(
      'title_deed',
      'completed',
    );
    expect(commissionService.calculate).toHaveBeenCalledWith({
      totalServiceFee: 1000,
      listingAgentId,
      sellingAgentId,
    });
    expect(transaction.breakdown).toBe(breakdown);
    expect(transaction.save).toHaveBeenCalledTimes(1);
    expect(result).toBe(transaction);
  });

  it('throws and does not save when stage transition is invalid', async () => {
    const transaction = createTransactionDocumentMock({
      stage: 'agreement',
      totalServiceFee: 1000,
      listingAgentId,
      sellingAgentId,
    });

    transactionModel.findById.mockReturnValue(createFindByIdQuery(transaction));
    stageTransitionService.assertCanTransition.mockImplementation(() => {
      throw new BadRequestException(
        'Transaction cannot transition from "agreement" to "completed"',
      );
    });

    await expect(
      service.updateTransactionStage(transactionId, { stage: 'completed' }),
    ).rejects.toThrow(BadRequestException);

    expect(transaction.save).not.toHaveBeenCalled();
    expect(commissionService.calculate).not.toHaveBeenCalled();
    expect(transaction.stage).toBe('agreement');
    expect(transaction.stageHistory).toEqual([]);
  });
});

function createFindByIdQuery(result: unknown) {
  return {
    exec: jest.fn().mockResolvedValue(result),
    populate: jest.fn().mockReturnThis(),
  };
}

function createTransactionDocumentMock({
  listingAgentId,
  sellingAgentId,
  stage,
  totalServiceFee,
}: {
  listingAgentId: string;
  sellingAgentId: string;
  stage: 'agreement' | 'earnest_money' | 'title_deed' | 'completed';
  totalServiceFee: number;
}) {
  const transaction = {
    breakdown: null,
    listingAgentId,
    save: jest.fn(),
    sellingAgentId,
    stage,
    stageHistory: [],
    totalServiceFee,
  };

  transaction.save.mockResolvedValue(transaction);

  return transaction;
}
