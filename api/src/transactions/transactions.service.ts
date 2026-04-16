import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AgentsService } from '../agents/agents.service';
import { CommissionService } from './commission.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionStageDto } from './dto/update-transaction-stage.dto';
import { StageTransitionService } from './stage-transition.service';
import {
  Transaction,
  TransactionDocument,
  TransactionStage,
} from './schemas/transaction.schema';

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

    const stage = createTransactionDto.stage ?? 'agreement';
    const breakdown =
      stage === 'completed'
        ? this.commissionService.calculate(createTransactionDto)
        : null;

    return this.transactionModel.create({
      ...createTransactionDto,
      stage,
      breakdown,
      stageHistory: [
        this.stageTransitionService.createHistoryItem(null, stage),
      ],
    });
  }

  getAllTransactions() {
    return this.transactionModel.find().sort({ createdAt: -1 }).exec();
  }

  async getTransactionById(id: string) {
    this.assertValidObjectId(id);

    const transaction = await this.transactionModel.findById(id).exec();

    if (!transaction) {
      throw new NotFoundException(`Transaction with id "${id}" was not found`);
    }

    return transaction;
  }

  async updateTransactionStage(
    id: string,
    updateStageDto: UpdateTransactionStageDto,
  ) {
    const transaction = await this.getTransactionById(id);
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
    const transaction = await this.getTransactionById(id);
    return transaction.breakdown;
  }

  private assertValidObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Transaction with id "${id}" was not found`);
    }
  }
}
