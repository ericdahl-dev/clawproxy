export function GET() {
  return Response.json({ ok: false, error: 'Unknown auth endpoint' }, { status: 404 });
}

export function POST() {
  return Response.json({ ok: false, error: 'Unknown auth endpoint' }, { status: 404 });
}
