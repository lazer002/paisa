// server/src/utils/pagination.js

import {
  PAGINATION,
  SORT,
} from "../config/constants.js";

const toPositiveInteger = (
  value,
  fallback
) => {
  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 1
  ) {
    return fallback;
  }

  return Math.floor(number);
};

const parsePagination = (query = {}) => {
  const page = toPositiveInteger(
    query.page,
    PAGINATION.DEFAULT_PAGE
  );

  const requestedLimit = toPositiveInteger(
    query.limit,
    PAGINATION.DEFAULT_LIMIT
  );

  const limit = Math.min(
    requestedLimit,
    PAGINATION.MAX_LIMIT
  );

  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

const parseSort = (
  sort,
  defaultField = SORT.DEFAULT_FIELD,
  defaultOrder = SORT.DEFAULT_ORDER
) => {
  if (!sort) {
    return {
      [defaultField]:
        defaultOrder === SORT.ASC ? 1 : -1,
    };
  }

  const sortObject = {};

  const fields = String(sort)
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);

  for (const field of fields) {
    if (!field) {
      continue;
    }

    const descending = field.startsWith("-");

    const fieldName = descending
      ? field.slice(1)
      : field;

    if (!fieldName) {
      continue;
    }

    sortObject[fieldName] = descending
      ? -1
      : 1;
  }

  if (Object.keys(sortObject).length === 0) {
    sortObject[defaultField] =
      defaultOrder === SORT.ASC ? 1 : -1;
  }

  return sortObject;
};

const buildPaginationMeta = ({
  page,
  limit,
  total,
}) => {
  const normalizedTotal = Math.max(
    0,
    Number(total) || 0
  );

  const totalPages =
    normalizedTotal === 0
      ? 0
      : Math.ceil(
          normalizedTotal / limit
        );

  return {
    page,
    limit,
    total: normalizedTotal,
    totalPages,
    hasNextPage:
      totalPages > 0 &&
      page < totalPages,
    hasPreviousPage: page > 1,
    nextPage:
      totalPages > 0 &&
      page < totalPages
        ? page + 1
        : null,
    previousPage:
      page > 1
        ? page - 1
        : null,
  };
};

const paginateQuery = async ({
  query,
  page = 1,
  limit = PAGINATION.DEFAULT_LIMIT,
  total,
}) => {
  const normalizedPage =
    toPositiveInteger(
      page,
      PAGINATION.DEFAULT_PAGE
    );

  const normalizedLimit = Math.min(
    toPositiveInteger(
      limit,
      PAGINATION.DEFAULT_LIMIT
    ),
    PAGINATION.MAX_LIMIT
  );

  const skip =
    (normalizedPage - 1) *
    normalizedLimit;

  const [data, count] =
    await Promise.all([
      query
        .skip(skip)
        .limit(normalizedLimit)
        .exec(),

      typeof total === "function"
        ? total()
        : Promise.resolve(total ?? 0),
    ]);

  return {
    data,
    pagination:
      buildPaginationMeta({
        page: normalizedPage,
        limit: normalizedLimit,
        total: count,
      }),
  };
};

const createPaginationQuery = (
  query = {}
) => {
  const pagination =
    parsePagination(query);

  const sort = parseSort(query.sort);

  return {
    ...pagination,
    sort,
  };
};

const getPaginationOffset = ({
  page = 1,
  limit = PAGINATION.DEFAULT_LIMIT,
}) => {
  const normalizedPage =
    toPositiveInteger(
      page,
      PAGINATION.DEFAULT_PAGE
    );

  const normalizedLimit = Math.min(
    toPositiveInteger(
      limit,
      PAGINATION.DEFAULT_LIMIT
    ),
    PAGINATION.MAX_LIMIT
  );

  return (
    (normalizedPage - 1) *
    normalizedLimit
  );
};

const isValidPage = (page) => {
  const value = Number(page);

  return (
    Number.isInteger(value) &&
    value >= 1
  );
};

const isValidLimit = (limit) => {
  const value = Number(limit);

  return (
    Number.isInteger(value) &&
    value >= PAGINATION.MIN_LIMIT &&
    value <= PAGINATION.MAX_LIMIT
  );
};

export {
  parsePagination,
  parseSort,
  buildPaginationMeta,
  paginateQuery,
  createPaginationQuery,
  getPaginationOffset,
  isValidPage,
  isValidLimit,
};

export default {
  parsePagination,
  parseSort,
  buildPaginationMeta,
  paginateQuery,
  createPaginationQuery,
  getPaginationOffset,
  isValidPage,
  isValidLimit,
};
