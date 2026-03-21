import { authApiHandler } from '@neondatabase/auth/next/server';

const handler = authApiHandler();

export async function GET(request: Request) {
  return handler.GET(request, { params: Promise.resolve({ path: [] }) });
}

export async function POST(request: Request) {
  return handler.POST(request, { params: Promise.resolve({ path: [] }) });
}
