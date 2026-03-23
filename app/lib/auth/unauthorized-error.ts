import 'server-only';

export class UnauthorizedError extends Error {
  override readonly name = 'UnauthorizedError';

  constructor(message = 'Unauthorized') {
    super(message);
  }
}
