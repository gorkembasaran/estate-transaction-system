import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AgentsService } from '../../../agents/services';
import { CreateTransactionDto } from '../../dto/create-transaction.dto';
import type { TransactionStage } from '../../enums/transaction-stage.enum';
import { FinancialBreakdown, StageHistoryItem } from '../../schemas';
import { CommissionService } from '../commission';
import { StageTransitionService } from '../lifecycle';
import { TransactionsService } from './transactions.service';

type TransactionModelMock = {
  countDocuments: jest.Mock;
  create: jest.Mock;
  find: jest.Mock;
  findById: jest.Mock;
};

type TransactionDocumentMock = {
  breakdown: FinancialBreakdown | null;
  listingAgentId: string;
  save: jest.Mock;
  sellingAgentId: string;
  stage: TransactionStage;
  stageHistory: StageHistoryItem[];
  totalServiceFee: number;
};

type AgentServiceMock = Pick<AgentsService, 'validateAgentExists'>;
type CommissionServiceMock = Pick<CommissionService, 'calculate'>;
type StageTransitionServiceMock = Pick<
  StageTransitionService,
  'assertCanTransition' | 'createHistoryItem'
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
      countDocuments: jest.fn(),
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

  it('does not create a transaction when agent validation fails', async () => {
    agentsService.validateAgentExists.mockRejectedValueOnce(
      new NotFoundException(`Agent with id "${listingAgentId}" was not found`),
    );

    await expect(
      service.createTransaction(createTransactionDto),
    ).rejects.toThrow(NotFoundException);

    expect(transactionModel.create).not.toHaveBeenCalled();
    expect(stageTransitionService.createHistoryItem).not.toHaveBeenCalled();
  });

  it('starts every created transaction in agreement stage', async () => {
    transactionModel.create.mockImplementation(resolveWithPayload);

    const transaction = await service.createTransaction(createTransactionDto);

    expect(transaction).toMatchObject({
      stage: 'agreement',
      breakdown: null,
    });
    expect(transactionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyTitle: createTransactionDto.propertyTitle,
        totalServiceFee: createTransactionDto.totalServiceFee,
        currency: createTransactionDto.currency,
        listingAgentId: createTransactionDto.listingAgentId,
        sellingAgentId: createTransactionDto.sellingAgentId,
        stage: 'agreement',
        breakdown: null,
      }),
    );
    expect(commissionService.calculate).not.toHaveBeenCalled();
  });

  it('adds an initial stage history item when creating a transaction', async () => {
    const historyItem: StageHistoryItem = {
      fromStage: null,
      toStage: 'agreement',
      changedAt: new Date('2026-04-16T12:00:00.000Z'),
    };
    stageTransitionService.createHistoryItem.mockReturnValue(historyItem);
    transactionModel.create.mockImplementation(resolveWithPayload);

    const transaction = await service.createTransaction(createTransactionDto);

    expect(stageTransitionService.createHistoryItem).toHaveBeenCalledWith(
      null,
      'agreement',
    );
    expect(transaction.stageHistory).toEqual([historyItem]);
    expect(transactionModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        stageHistory: [historyItem],
      }),
    );
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
    const completedHistoryItem: StageHistoryItem = {
      fromStage: 'title_deed',
      toStage: 'completed',
      changedAt: new Date('2026-04-16T13:00:00.000Z'),
    };
    stageTransitionService.createHistoryItem.mockReturnValue(
      completedHistoryItem,
    );
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
    expect(transaction.stage).toBe('completed');
    expect(transaction.stageHistory).toEqual([completedHistoryItem]);
    expect(transaction.breakdown).toBe(breakdown);
    expect(transaction.save).toHaveBeenCalledTimes(1);
    expect(result).toBe(transaction);
  });

  it('updates stage, adds history, and skips breakdown for valid non-final transitions', async () => {
    const transaction = createTransactionDocumentMock({
      stage: 'agreement',
      totalServiceFee: 1000,
      listingAgentId,
      sellingAgentId,
    });
    const historyItem: StageHistoryItem = {
      fromStage: 'agreement',
      toStage: 'earnest_money',
      changedAt: new Date('2026-04-16T13:00:00.000Z'),
    };

    transactionModel.findById.mockReturnValue(createFindByIdQuery(transaction));
    stageTransitionService.createHistoryItem.mockReturnValue(historyItem);

    const result = await service.updateTransactionStage(transactionId, {
      stage: 'earnest_money',
    });

    expect(stageTransitionService.assertCanTransition).toHaveBeenCalledWith(
      'agreement',
      'earnest_money',
    );
    expect(stageTransitionService.createHistoryItem).toHaveBeenCalledWith(
      'agreement',
      'earnest_money',
    );
    expect(commissionService.calculate).not.toHaveBeenCalled();
    expect(transaction.stage).toBe('earnest_money');
    expect(transaction.breakdown).toBeNull();
    expect(transaction.stageHistory).toEqual([historyItem]);
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

  it('returns paginated transactions using populated agent fields and last-updated-first sorting', async () => {
    const transactions = [{ _id: transactionId }];
    const query = createFindQuery(transactions);
    transactionModel.find.mockReturnValue(query);
    transactionModel.countDocuments.mockReturnValue(createCountQuery(12));

    const result = await service.getAllTransactions({ page: 2, limit: 5 });

    expect(transactionModel.find).toHaveBeenCalledWith({});
    expect(query.populate).toHaveBeenCalledWith(
      'listingAgentId',
      'fullName email',
    );
    expect(query.populate).toHaveBeenCalledWith(
      'sellingAgentId',
      'fullName email',
    );
    expect(query.sort).toHaveBeenCalledWith({ updatedAt: -1 });
    expect(query.skip).toHaveBeenCalledWith(5);
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(query.exec).toHaveBeenCalledTimes(1);
    expect(transactionModel.countDocuments).toHaveBeenCalledWith({});
    expect(result).toEqual({
      items: transactions,
      meta: {
        hasNextPage: true,
        hasPreviousPage: true,
        limit: 5,
        page: 2,
        totalItems: 12,
        totalPages: 3,
      },
    });
  });

  it('returns an empty transaction list when no transactions exist', async () => {
    const query = createFindQuery([]);
    transactionModel.find.mockReturnValue(query);
    transactionModel.countDocuments.mockReturnValue(createCountQuery(0));

    await expect(service.getAllTransactions({})).resolves.toEqual({
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

    expect(query.exec).toHaveBeenCalledTimes(1);
  });

  it('applies stage and search filters when listing transactions', async () => {
    const query = createFindQuery([]);
    transactionModel.find.mockReturnValue(query);
    transactionModel.countDocuments.mockReturnValue(createCountQuery(0));

    await service.getAllTransactions({
      limit: 10,
      page: 1,
      search: 'villa',
      stage: 'completed',
    });

    expect(transactionModel.find).toHaveBeenCalledWith({
      $or: [{ propertyTitle: /villa/i }, { currency: /villa/i }],
      stage: 'completed',
    });
    expect(transactionModel.countDocuments).toHaveBeenCalledWith({
      $or: [{ propertyTitle: /villa/i }, { currency: /villa/i }],
      stage: 'completed',
    });
  });

  it('applies created date range filters when listing transactions', async () => {
    const query = createFindQuery([]);
    transactionModel.find.mockReturnValue(query);
    transactionModel.countDocuments.mockReturnValue(createCountQuery(0));

    await service.getAllTransactions({
      dateFrom: '2026-04-01',
      dateTo: '2026-04-30',
      limit: 10,
      page: 1,
    });

    const expectedFilter = {
      createdAt: {
        $gte: new Date('2026-04-01T00:00:00.000Z'),
        $lte: new Date('2026-04-30T23:59:59.999Z'),
      },
    };

    expect(transactionModel.find).toHaveBeenCalledWith(expectedFilter);
    expect(transactionModel.countDocuments).toHaveBeenCalledWith(
      expectedFilter,
    );
  });

  it('applies requested sorting when listing transactions', async () => {
    const query = createFindQuery([]);
    transactionModel.find.mockReturnValue(query);
    transactionModel.countDocuments.mockReturnValue(createCountQuery(0));

    await service.getAllTransactions({
      limit: 10,
      page: 1,
      sortBy: 'totalServiceFee',
      sortOrder: 'asc',
    });

    expect(query.sort).toHaveBeenCalledWith({ totalServiceFee: 1 });
  });

  it('throws BadRequestException when date range is invalid', async () => {
    await expect(
      service.getAllTransactions({
        dateFrom: '2026-04-30',
        dateTo: '2026-04-01',
        limit: 10,
        page: 1,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(transactionModel.find).not.toHaveBeenCalled();
    expect(transactionModel.countDocuments).not.toHaveBeenCalled();
  });

  it('returns a transaction with populated agent fields', async () => {
    const transaction = createTransactionDocumentMock({
      stage: 'agreement',
      totalServiceFee: 1000,
      listingAgentId,
      sellingAgentId,
    });
    const query = createFindByIdQuery(transaction);
    transactionModel.findById.mockReturnValue(query);

    const result = await service.getTransactionById(transactionId);

    expect(transactionModel.findById).toHaveBeenCalledWith(transactionId);
    expect(query.populate).toHaveBeenCalledWith(
      'listingAgentId',
      'fullName email',
    );
    expect(query.populate).toHaveBeenCalledWith(
      'sellingAgentId',
      'fullName email',
    );
    expect(query.exec).toHaveBeenCalledTimes(1);
    expect(result).toBe(transaction);
  });

  it('returns the stored breakdown for a transaction', async () => {
    const breakdown: FinancialBreakdown = {
      agencyAmount: 500,
      listingAgentAmount: 250,
      sellingAgentAmount: 250,
      listingAgentReason: 'listing reason',
      sellingAgentReason: 'selling reason',
      calculatedAt: new Date('2026-04-16T12:00:00.000Z'),
    };
    const transaction = createTransactionDocumentMock({
      stage: 'completed',
      totalServiceFee: 1000,
      listingAgentId,
      sellingAgentId,
    });
    transaction.breakdown = breakdown;

    transactionModel.findById.mockReturnValue(createFindByIdQuery(transaction));

    await expect(service.getTransactionBreakdown(transactionId)).resolves.toBe(
      breakdown,
    );
  });

  it('returns null when transaction breakdown is not calculated yet', async () => {
    const transaction = createTransactionDocumentMock({
      stage: 'agreement',
      totalServiceFee: 1000,
      listingAgentId,
      sellingAgentId,
    });

    transactionModel.findById.mockReturnValue(createFindByIdQuery(transaction));

    await expect(
      service.getTransactionBreakdown(transactionId),
    ).resolves.toBeNull();
  });

  it('throws BadRequestException when transaction id is invalid', async () => {
    await expect(service.getTransactionById('invalid-id')).rejects.toThrow(
      BadRequestException,
    );

    expect(transactionModel.findById).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when transaction cannot be found', async () => {
    transactionModel.findById.mockReturnValue(createFindByIdQuery(null));

    await expect(service.getTransactionById(transactionId)).rejects.toThrow(
      NotFoundException,
    );
  });
});

function createFindQuery(result: unknown) {
  return {
    exec: jest.fn().mockResolvedValue(result),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
  };
}

function resolveWithPayload(payload: unknown) {
  return Promise.resolve(payload);
}

function createCountQuery(result: number) {
  return {
    exec: jest.fn().mockResolvedValue(result),
  };
}

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
  stage: TransactionStage;
  totalServiceFee: number;
}): TransactionDocumentMock {
  const transaction: TransactionDocumentMock = {
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
