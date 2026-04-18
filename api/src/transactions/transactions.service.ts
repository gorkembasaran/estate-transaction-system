import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgentsService } from '../agents/agents.service';
import { CommissionService } from './commission.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import {
  GetTransactionsQueryDto,
  type TransactionSortField,
} from './dto/get-transactions-query.dto';
import { UpdateTransactionStageDto } from './dto/update-transaction-stage.dto';
import type { TransactionStage } from './enums/transaction-stage.enum';
import { StageTransitionService } from './stage-transition.service';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';

type TransactionListFilter = {
  $or?: Array<{ currency: RegExp } | { propertyTitle: RegExp }>;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  stage?: TransactionStage;
};

type TransactionListSort = Partial<Record<TransactionSortField, 1 | -1>>;

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly agentsService: AgentsService,
    private readonly commissionService: CommissionService,
    private readonly stageTransitionService: StageTransitionService,
  ) {}

  async createTransaction(createTransactionDto: CreateTransactionDto) {
    await Promise.all([
      this.agentsService.validateAgentExists(
        createTransactionDto.listingAgentId,
      ),
      this.agentsService.validateAgentExists(
        createTransactionDto.sellingAgentId,
      ),
    ]);

    const stage: TransactionStage = 'agreement';

    return this.transactionModel.create({
      ...createTransactionDto,
      stage,
      breakdown: null,
      stageHistory: [
        this.stageTransitionService.createHistoryItem(null, stage),
      ],
    });
  }

  async getAllTransactions(query: GetTransactionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const filter = this.buildTransactionFilter(query);
    const sort = this.buildTransactionSort(query);

    const [items, totalItems] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate('listingAgentId', 'fullName email')
        .populate('sellingAgentId', 'fullName email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.transactionModel.countDocuments(filter).exec(),
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

  async getTransactionById(id: string) {
    return this.getTransactionDocumentById(id, true);
  }

  async updateTransactionStage(
    id: string,
    updateStageDto: UpdateTransactionStageDto,
  ) {
    const transaction = await this.getTransactionDocumentById(id);
    const nextStage = updateStageDto.stage;

    this.stageTransitionService.assertCanTransition(
      transaction.stage,
      nextStage,
    );

    const previousStage = transaction.stage;
    transaction.stage = nextStage;
    transaction.stageHistory.push(
      this.stageTransitionService.createHistoryItem(previousStage, nextStage),
    );

    if (nextStage === 'completed') {
      transaction.breakdown = this.commissionService.calculate({
        totalServiceFee: transaction.totalServiceFee,
        listingAgentId: transaction.listingAgentId,
        sellingAgentId: transaction.sellingAgentId,
      });
    }

    return transaction.save();
  }

  async getTransactionBreakdown(id: string) {
    const transaction = await this.getTransactionDocumentById(id);
    return transaction.breakdown;
  }

  private async getTransactionDocumentById(id: string, populateAgents = false) {
    this.assertValidObjectId(id);

    let query = this.transactionModel.findById(id);

    if (populateAgents) {
      query = query
        .populate('listingAgentId', 'fullName email')
        .populate('sellingAgentId', 'fullName email');
    }

    const transaction = await query.exec();

    if (!transaction) {
      throw new NotFoundException(`Transaction with id "${id}" was not found`);
    }

    return transaction;
  }

  private assertValidObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid transaction id: "${id}"`);
    }
  }

  private buildTransactionFilter(
    query: GetTransactionsQueryDto,
  ): TransactionListFilter {
    const filter: TransactionListFilter = {};

    if (query.stage) {
      filter.stage = query.stage;
    }

    if (query.search) {
      const searchPattern = new RegExp(escapeRegex(query.search), 'i');

      filter.$or = [
        { propertyTitle: searchPattern },
        { currency: searchPattern },
      ];
    }

    const dateFilter = this.buildCreatedAtFilter(query);

    if (dateFilter) {
      filter.createdAt = dateFilter;
    }

    return filter;
  }

  private buildCreatedAtFilter(query: GetTransactionsQueryDto) {
    if (!query.dateFrom && !query.dateTo) {
      return null;
    }

    const createdAtFilter: TransactionListFilter['createdAt'] = {};

    if (query.dateFrom) {
      createdAtFilter.$gte = createDateBoundary(query.dateFrom, 'start');
    }

    if (query.dateTo) {
      createdAtFilter.$lte = createDateBoundary(query.dateTo, 'end');
    }

    if (
      createdAtFilter.$gte &&
      createdAtFilter.$lte &&
      createdAtFilter.$gte > createdAtFilter.$lte
    ) {
      throw new BadRequestException(
        'dateFrom must be earlier than or equal to dateTo',
      );
    }

    return createdAtFilter;
  }

  private buildTransactionSort(
    query: GetTransactionsQueryDto,
  ): TransactionListSort {
    const sortBy = query.sortBy ?? 'createdAt';
    const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

    return {
      [sortBy]: sortDirection,
    };
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createDateBoundary(value: string, boundary: 'start' | 'end') {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid date value: "${value}"`);
  }

  if (boundary === 'start') {
    date.setUTCHours(0, 0, 0, 0);
  } else {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date;
}
