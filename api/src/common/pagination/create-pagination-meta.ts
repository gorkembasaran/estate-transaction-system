export type CreatePaginationMetaParams = {
  limit: number;
  page: number;
  totalItems: number;
};

export function createPaginationMeta({
  limit,
  page,
  totalItems,
}: CreatePaginationMetaParams) {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1 && totalItems > 0,
    limit,
    page,
    totalItems,
    totalPages,
  };
}
