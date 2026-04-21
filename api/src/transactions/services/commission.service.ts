import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import type { FinancialBreakdown } from '../schemas';

interface CalculateCommissionInput {
  totalServiceFee: number;
  listingAgentId: Types.ObjectId | string;
  sellingAgentId: Types.ObjectId | string;
}

@Injectable()
export class CommissionService {
  calculate(input: CalculateCommissionInput): FinancialBreakdown {
    if (input.totalServiceFee < 0) {
      throw new BadRequestException('Total service fee cannot be negative');
    }

    const agencyAmount = this.roundMoney(input.totalServiceFee * 0.5);
    const agentPoolAmount = this.roundMoney(
      input.totalServiceFee - agencyAmount,
    );
    const isSameAgent =
      input.listingAgentId.toString() === input.sellingAgentId.toString();

    if (isSameAgent) {
      return {
        agencyAmount,
        listingAgentAmount: agentPoolAmount,
        sellingAgentAmount: 0,
        listingAgentReason:
          'Listing and selling agent are the same person, so this agent receives the full agent portion.',
        sellingAgentReason:
          'No separate selling-agent payout is created because the selling agent is the listing agent.',
        calculatedAt: new Date(),
      };
    }

    const listingAgentAmount = this.roundMoney(agentPoolAmount / 2);
    const sellingAgentAmount = this.roundMoney(
      agentPoolAmount - listingAgentAmount,
    );

    return {
      agencyAmount,
      listingAgentAmount,
      sellingAgentAmount,
      listingAgentReason:
        'Listing agent receives half of the agent portion because the listing and selling agents are different.',
      sellingAgentReason:
        'Selling agent receives half of the agent portion because the listing and selling agents are different.',
      calculatedAt: new Date(),
    };
  }

  private roundMoney(value: number) {
    return Math.round(value * 100) / 100;
  }
}
