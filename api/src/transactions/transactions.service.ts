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
import { UpdateTransactionStageDto } from './dto/update-transaction-stage.dto';
import type { TransactionStage } from './enums/transaction-stage.enum';
import { StageTransitionService } from './stage-transition.service';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';

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

  getAllTransactions() {
    return this.transactionModel
      .find()
      .populate('listingAgentId', 'fullName email')
      .populate('sellingAgentId', 'fullName email')
      .sort({ createdAt: -1 })
      .exec();
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

    if (this.stageTransitionService.isFinalStage(nextStage)) {
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
}
