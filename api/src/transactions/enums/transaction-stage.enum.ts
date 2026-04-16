export const TRANSACTION_STAGES = [
  'agreement',
  'earnest_money',
  'title_deed',
  'completed',
] as const;

export type TransactionStage = (typeof TRANSACTION_STAGES)[number];
