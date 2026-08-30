import { NextResponse, type NextRequest } from 'next/server';
import { getChatBackend } from '@/lib/api/backend';
import { resetSessionContext } from '@/lib/api/adk/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: { sessionId?: string };
  try {
    body = (await req.json()) as { sessionId?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body?.sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const userId = req.headers.get('x-user-id') ?? 'anonymous';

  if (getChatBackend() === 'local') {
    try {
      await resetSessionContext(userId, body.sessionId);
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true });
}
