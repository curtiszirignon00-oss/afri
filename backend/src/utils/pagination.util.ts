export const MAX_PAGE_LIMIT = 100;

export function parsePagination(
  limitRaw: unknown,
  pageRaw: unknown,
  defaultLimit = 20
): { limit: number; page: number; skip: number } {
  const limit = Math.min(
    Math.max(1, parseInt(String(limitRaw || defaultLimit), 10) || defaultLimit),
    MAX_PAGE_LIMIT
  );
  const page = Math.max(1, parseInt(String(pageRaw || 1), 10) || 1);
  return { limit, page, skip: (page - 1) * limit };
}
