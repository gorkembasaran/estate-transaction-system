import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgentsService } from '../../agents/services';
import {
  TRANSACTION_AGENT_POPULATE_FIELDS,
  TRANSACTION_LISTING_AGENT_PATH,
  TRANSACTION_SELLING_AGENT_PATH,
} from '../constants';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { GetTransactionsQueryDto } from '../dto/get-transactions-query.dto';
import { UpdateTransactionStageDto } from '../dto/update-transaction-stage.dto';
import type { TransactionStage } from '../enums/transaction-stage.enum';
import { buildTransactionListQuery } from '../query';
import { Transaction } from '../schemas';
import type { TransactionDocument } from '../schemas';
import { CommissionService } from './commission.service';
import { StageTransitionService } from './stage-transition.service';

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
    const { filter, limit, page, skip, sort } =
      buildTransactionListQuery(query);

    const [items, totalItems] = await Promise.all([
      this.transactionModel
        .find(filter)
        .populate(
          TRANSACTION_LISTING_AGENT_PATH,
          TRANSACTION_AGENT_POPULATE_FIELDS,
        )
        .populate(
          TRANSACTION_SELLING_AGENT_PATH,
          TRANSACTION_AGENT_POPULATE_FIELDS,
        )
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
        .populate(
          TRANSACTION_LISTING_AGENT_PATH,
          TRANSACTION_AGENT_POPULATE_FIELDS,
        )
        .populate(
          TRANSACTION_SELLING_AGENT_PATH,
          TRANSACTION_AGENT_POPULATE_FIELDS,
        );
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
}
