const DEFAULT_POST_SIGN_IN_PATH = '/dashboard';

export function resolvePostSignInRedirect(nextParam: string | null | undefined): string {
  if (!nextParam) {
    return DEFAULT_POST_SIGN_IN_PATH;
  }

  const trimmed = nextParam.trim();

  if (!trimmed.startsWith('/')) {
    return DEFAULT_POST_SIGN_IN_PATH;
  }

  if (trimmed.startsWith('//')) {
    return DEFAULT_POST_SIGN_IN_PATH;
  }

  if (trimmed.includes('\\')) {
    return DEFAULT_POST_SIGN_IN_PATH;
  }

  return trimmed;
}
