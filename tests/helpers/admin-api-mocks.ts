/** Shared admin session user for API route tests (per-file `mockRequireAdminUser` must stay local — Vitest cannot export hoisted mocks). */
export const mockAdminUser = {
  id: 'user-1',
  email: 'admin@example.com',
} as const;
