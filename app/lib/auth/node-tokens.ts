import 'server-only';

import crypto from 'node:crypto';

const TOKEN_PREFIX = 'cpn';

export type GeneratedNodeToken = {
  token: string;
  tokenHash: string;
};

export function generateNodeToken(): GeneratedNodeToken {
  const secret = crypto.randomBytes(32).toString('base64url');
  const token = `${TOKEN_PREFIX}_${secret}`;

  return {
    token,
    tokenHash: hashNodeToken(token),
  };
}

export function hashNodeToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token;
}
