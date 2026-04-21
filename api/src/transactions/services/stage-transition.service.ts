import { BadRequestException, Injectable } from '@nestjs/common';
import type { TransactionStage } from '../enums/transaction-stage.enum';
import type { StageHistoryItem } from '../schemas';

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
}
