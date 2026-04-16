import { BadRequestException } from '@nestjs/common';
import { StageTransitionService } from './stage-transition.service';

describe('StageTransitionService', () => {
  let service: StageTransitionService;

  beforeEach(() => {
    service = new StageTransitionService();
  });

  it('allows agreement to earnest_money transition', () => {
    expect(() =>
      service.assertCanTransition('agreement', 'earnest_money'),
    ).not.toThrow();
  });

  it('allows earnest_money to title_deed transition', () => {
    expect(() =>
      service.assertCanTransition('earnest_money', 'title_deed'),
    ).not.toThrow();
  });

  it('allows title_deed to completed transition', () => {
    expect(() =>
      service.assertCanTransition('title_deed', 'completed'),
    ).not.toThrow();
  });

  it('rejects agreement to completed transition', () => {
    expect(() => service.assertCanTransition('agreement', 'completed')).toThrow(
      BadRequestException,
    );
  });

  it('rejects completed to agreement transition', () => {
    expect(() => service.assertCanTransition('completed', 'agreement')).toThrow(
      BadRequestException,
    );
  });

  it('rejects transitioning to the same stage', () => {
    expect(() => service.assertCanTransition('agreement', 'agreement')).toThrow(
      BadRequestException,
    );
  });

  it('creates an initial stage history item when there is no previous stage', () => {
    const historyItem = service.createHistoryItem(null, 'agreement');

    expect(historyItem).toMatchObject({
      fromStage: null,
      toStage: 'agreement',
    });
    expectValidDate(historyItem.changedAt);
  });

  it('creates a stage history item with from stage, to stage, and change date', () => {
    const historyItem = service.createHistoryItem('agreement', 'earnest_money');

    expect(historyItem).toMatchObject({
      fromStage: 'agreement',
      toStage: 'earnest_money',
    });
    expectValidDate(historyItem.changedAt);
  });
});

function expectValidDate(value: Date) {
  expect(value).toBeInstanceOf(Date);
  expect(Number.isNaN(value.getTime())).toBe(false);
}
