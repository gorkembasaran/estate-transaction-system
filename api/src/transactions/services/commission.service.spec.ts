import { BadRequestException } from '@nestjs/common';
import { CommissionService } from './commission.service';

describe('CommissionService', () => {
  let service: CommissionService;

  beforeEach(() => {
    service = new CommissionService();
  });

  it('allocates 50% to the agency and the full agent portion to one agent when both roles are the same agent', () => {
    const breakdown = service.calculate({
      totalServiceFee: 1000,
      listingAgentId: 'agent-1',
      sellingAgentId: 'agent-1',
    });

    expect(breakdown.agencyAmount).toBe(500);
    expect(breakdown.listingAgentAmount).toBe(500);
    expect(breakdown.sellingAgentAmount).toBe(0);
    expectReasonToInclude(breakdown.listingAgentReason, [
      'same person',
      'full agent portion',
    ]);
    expectReasonToInclude(breakdown.sellingAgentReason, [
      'no separate',
      'listing agent',
    ]);
    expectBalancedDistribution(breakdown, 1000);
    expectValidDate(breakdown.calculatedAt);
  });

  it('allocates 50% to the agency and splits the agent portion equally when agents are different', () => {
    const breakdown = service.calculate({
      totalServiceFee: 1000,
      listingAgentId: 'listing-agent',
      sellingAgentId: 'selling-agent',
    });

    expect(breakdown.agencyAmount).toBe(500);
    expect(breakdown.listingAgentAmount).toBe(250);
    expect(breakdown.sellingAgentAmount).toBe(250);
    expectReasonToInclude(breakdown.listingAgentReason, ['half', 'different']);
    expectReasonToInclude(breakdown.sellingAgentReason, ['half', 'different']);
    expectBalancedDistribution(breakdown, 1000);
    expectValidDate(breakdown.calculatedAt);
  });

  it('rounds fractional service fees to two decimal places without losing the total amount', () => {
    const breakdown = service.calculate({
      totalServiceFee: 100.01,
      listingAgentId: 'listing-agent',
      sellingAgentId: 'selling-agent',
    });

    expect(breakdown.agencyAmount).toBe(50.01);
    expect(breakdown.listingAgentAmount).toBe(25);
    expect(breakdown.sellingAgentAmount).toBe(25);
    expectBalancedDistribution(breakdown, 100.01);
    expectValidDate(breakdown.calculatedAt);
  });

  it('keeps the final distribution balanced for small decimal values', () => {
    const breakdown = service.calculate({
      totalServiceFee: 0.03,
      listingAgentId: 'listing-agent',
      sellingAgentId: 'selling-agent',
    });

    expectBalancedDistribution(breakdown, 0.03);
    expectValidDate(breakdown.calculatedAt);
  });

  it('handles zero service fee without errors', () => {
    const breakdown = service.calculate({
      totalServiceFee: 0,
      listingAgentId: 'listing-agent',
      sellingAgentId: 'selling-agent',
    });

    expect(breakdown.agencyAmount).toBe(0);
    expect(breakdown.listingAgentAmount).toBe(0);
    expect(breakdown.sellingAgentAmount).toBe(0);
    expectBalancedDistribution(breakdown, 0);
    expectValidDate(breakdown.calculatedAt);
  });

  it('handles large service fees correctly', () => {
    const breakdown = service.calculate({
      totalServiceFee: 1_000_000,
      listingAgentId: 'listing-agent',
      sellingAgentId: 'selling-agent',
    });

    expect(breakdown.agencyAmount).toBe(500_000);
    expect(breakdown.listingAgentAmount).toBe(250_000);
    expect(breakdown.sellingAgentAmount).toBe(250_000);
    expectBalancedDistribution(breakdown, 1_000_000);
    expectValidDate(breakdown.calculatedAt);
  });

  it('handles very small decimal values correctly', () => {
    const breakdown = service.calculate({
      totalServiceFee: 0.01,
      listingAgentId: 'listing-agent',
      sellingAgentId: 'selling-agent',
    });

    expectBalancedDistribution(breakdown, 0.01);
    expectValidDate(breakdown.calculatedAt);
  });

  it('handles same-agent case with decimal values correctly', () => {
    const breakdown = service.calculate({
      totalServiceFee: 123.45,
      listingAgentId: 'agent-1',
      sellingAgentId: 'agent-1',
    });

    expect(breakdown.sellingAgentAmount).toBe(0);
    expect(breakdown.listingAgentAmount).toBeGreaterThan(0);
    expectBalancedDistribution(breakdown, 123.45);
    expectValidDate(breakdown.calculatedAt);
  });

  it('throws BadRequestException when service fee is negative', () => {
    expect(() =>
      service.calculate({
        totalServiceFee: -100,
        listingAgentId: 'listing-agent',
        sellingAgentId: 'selling-agent',
      }),
    ).toThrow('Total service fee cannot be negative');
  });
});

function expectBalancedDistribution(
  breakdown: {
    agencyAmount: number;
    listingAgentAmount: number;
    sellingAgentAmount: number;
  },
  totalServiceFee: number,
) {
  expect(
    breakdown.agencyAmount +
      breakdown.listingAgentAmount +
      breakdown.sellingAgentAmount,
  ).toBeCloseTo(totalServiceFee, 2);
}

function expectReasonToInclude(reason: string, keywords: string[]) {
  expect(reason).not.toBe('');

  const normalizedReason = reason.toLowerCase();

  for (const keyword of keywords) {
    expect(normalizedReason).toContain(keyword);
  }
}

function expectValidDate(value: Date) {
  expect(value).toBeInstanceOf(Date);
  expect(Number.isNaN(value.getTime())).toBe(false);

  const diffFromNow = Math.abs(Date.now() - value.getTime());

  expect(diffFromNow).toBeLessThan(10000);
}
