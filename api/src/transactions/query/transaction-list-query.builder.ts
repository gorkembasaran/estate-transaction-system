import { BadRequestException } from '@nestjs/common';
import {
  GetTransactionsQueryDto,
  type TransactionSortField,
} from '../dto/get-transactions-query.dto';
import type { TransactionStage } from '../enums/transaction-stage.enum';

export type TransactionListFilter = {
  $or?: Array<{ currency: RegExp } | { propertyTitle: RegExp }>;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  stage?: TransactionStage;
};

export type TransactionListSort = Partial<Record<TransactionSortField, 1 | -1>>;

export type TransactionListQueryOptions = {
  filter: TransactionListFilter;
  limit: number;
  page: number;
  skip: number;
  sort: TransactionListSort;
};

export function buildTransactionListQuery(
  query: GetTransactionsQueryDto,
): TransactionListQueryOptions {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  return {
    filter: buildTransactionFilter(query),
    limit,
    page,
    skip: (page - 1) * limit,
    sort: buildTransactionSort(query),
  };
}

function buildTransactionFilter(
  query: GetTransactionsQueryDto,
): TransactionListFilter {
  const filter: TransactionListFilter = {};

  if (query.stage) {
    filter.stage = query.stage;
  }

  if (query.search) {
    const searchPattern = new RegExp(escapeRegex(query.search), 'i');

    filter.$or = [
      { propertyTitle: searchPattern },
      { currency: searchPattern },
    ];
  }

  const createdAtFilter = buildCreatedAtFilter(query);

  if (createdAtFilter) {
    filter.createdAt = createdAtFilter;
  }

  return filter;
}

function buildCreatedAtFilter(query: GetTransactionsQueryDto) {
  if (!query.dateFrom && !query.dateTo) {
    return null;
  }

  const createdAtFilter: TransactionListFilter['createdAt'] = {};

  if (query.dateFrom) {
    createdAtFilter.$gte = createDateBoundary(query.dateFrom, 'start');
  }

  if (query.dateTo) {
    createdAtFilter.$lte = createDateBoundary(query.dateTo, 'end');
  }

  if (
    createdAtFilter.$gte &&
    createdAtFilter.$lte &&
    createdAtFilter.$gte > createdAtFilter.$lte
  ) {
    throw new BadRequestException(
      'dateFrom must be earlier than or equal to dateTo',
    );
  }

  return createdAtFilter;
}

function buildTransactionSort(
  query: GetTransactionsQueryDto,
): TransactionListSort {
  const sortBy = query.sortBy ?? 'updatedAt';
  const sortDirection = query.sortOrder === 'asc' ? 1 : -1;

  return {
    [sortBy]: sortDirection,
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createDateBoundary(value: string, boundary: 'start' | 'end') {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Invalid date value: "${value}"`);
  }

  if (boundary === 'start') {
    date.setUTCHours(0, 0, 0, 0);
  } else {
    date.setUTCHours(23, 59, 59, 999);
  }

  return date;
}
