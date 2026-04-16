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
    expect(breakdown.listingAgentReason).toEqual(expect.any(String));
    expect(breakdown.sellingAgentReason).toEqual(expect.any(String));
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
    expect(breakdown.listingAgentReason).toEqual(expect.any(String));
    expect(breakdown.sellingAgentReason).toEqual(expect.any(String));
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
    expect(
      breakdown.agencyAmount +
        breakdown.listingAgentAmount +
        breakdown.sellingAgentAmount,
    ).toBeCloseTo(100.01, 2);
  });

  it('keeps the final distribution balanced for small decimal values', () => {
    const breakdown = service.calculate({
      totalServiceFee: 0.03,
      listingAgentId: 'listing-agent',
      sellingAgentId: 'selling-agent',
    });

    expect(
      breakdown.agencyAmount +
        breakdown.listingAgentAmount +
        breakdown.sellingAgentAmount,
    ).toBeCloseTo(0.03, 2);
    expectValidDate(breakdown.calculatedAt);
  });
});

function expectValidDate(value: Date) {
  expect(value).toBeInstanceOf(Date);
  expect(Number.isNaN(value.getTime())).toBe(false);
}
