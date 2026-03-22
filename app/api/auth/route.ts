import { auth } from '@/app/lib/auth/server';

const handler = auth.handler();

export async function GET(request: Request) {
  return handler.GET(request, { params: Promise.resolve({ path: [] }) });
}

export async function POST(request: Request) {
  return handler.POST(request, { params: Promise.resolve({ path: [] }) });
}
