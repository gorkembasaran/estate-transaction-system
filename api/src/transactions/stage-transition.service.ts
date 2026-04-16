import { BadRequestException, Injectable } from '@nestjs/common';
import type { TransactionStage } from './enums/transaction-stage.enum';
import { StageHistoryItem } from './schemas/transaction.schema';

const ALLOWED_TRANSITIONS: Record<TransactionStage, TransactionStage[]> = {
  agreement: ['earnest_money'],
  earnest_money: ['title_deed'],
  title_deed: ['completed'],
  completed: [],
};

@Injectable()
export class StageTransitionService {
  assertCanTransition(fromStage: TransactionStage, toStage: TransactionStage) {
    const allowedNextStages = ALLOWED_TRANSITIONS[fromStage];

    if (!allowedNextStages.includes(toStage)) {
      throw new BadRequestException(
        `Transaction cannot transition from "${fromStage}" to "${toStage}"`,
      );
    }
  }

  createHistoryItem(
    fromStage: TransactionStage | null,
    toStage: TransactionStage,
  ): StageHistoryItem {
    return {
      fromStage,
      toStage,
      changedAt: new Date(),
    };
  }

  isFinalStage(stage: TransactionStage) {
    return stage === 'completed';
  }
}
