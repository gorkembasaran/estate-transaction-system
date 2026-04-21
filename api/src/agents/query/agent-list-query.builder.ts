import { GetAgentsQueryDto } from '../dto/get-agents-query.dto';

export type AgentListFilter = {
  $or?: Array<{ email: RegExp } | { fullName: RegExp }>;
  isActive?: boolean;
};

export type AgentListSort = {
  _id: -1;
  createdAt: -1;
};

export type AgentListQueryOptions = {
  filter: AgentListFilter;
  limit: number;
  page: number;
  skip: number;
  sort: AgentListSort;
};

const AGENT_LIST_SORT: AgentListSort = { createdAt: -1, _id: -1 };

export function buildAgentListQuery(
  query: GetAgentsQueryDto,
): AgentListQueryOptions {
  const page = query.page ?? 1;
  const limit = query.limit ?? 10;

  return {
    filter: buildAgentFilter(query),
    limit,
    page,
    skip: (page - 1) * limit,
    sort: AGENT_LIST_SORT,
  };
}

function buildAgentFilter(query: GetAgentsQueryDto): AgentListFilter {
  const filter: AgentListFilter = {};

  if (query.status === 'active') {
    filter.isActive = true;
  }

  if (query.status === 'inactive') {
    filter.isActive = false;
  }

  if (query.search) {
    const searchPattern = new RegExp(escapeRegex(query.search), 'i');

    filter.$or = [{ fullName: searchPattern }, { email: searchPattern }];
  }

  return filter;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
