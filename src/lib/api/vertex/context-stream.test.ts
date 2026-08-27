import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { streamAgentQuery } from './stream';
import { setAuthProvider } from './auth';
import type { AgentEvent } from './stream';

beforeAll(() => {
  process.env.VERTEX_PROJECT = 'test-project';
  process.env.VERTEX_REGION = 'us-central1';
  process.env.AGENT_ENGINE_ID = 'test-engine';
  setAuthProvider({ getToken: async () => 'test-token' });
});

afterAll(() => {
  delete process.env.VERTEX_PROJECT;
  delete process.env.VERTEX_REGION;
  delete process.env.AGENT_ENGINE_ID;
});

afterEach(() => {
  vi.restoreAllMocks();
});

const SCHEME_OPTIONS_JSON = JSON.stringify({
  type: 'scheme_selection',
  schemes: [
    {
      slug: 'discovery',
      name: 'Discovery Health Medical Scheme',
      plans: [{ id: 'executive', name: 'Executive Plan' }],
    },
    {
      slug: 'bonitas',
      name: 'Bonitas Medical Fund',
      plans: [{ id: 'boncomplete', name: 'BonComplete' }],
    },
  ],
});

function ndjsonResponse(lines: string[]): Response {
  const data = lines.join('\n') + '\n';
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(data));
      controller.close();
    },
  });
  return { ok: true, status: 200, statusText: 'OK', body: stream } as unknown as Response;
}

async function collectEvents(input = { userId: 'u', message: 'hi', sessionId: 's-abc' }): Promise<AgentEvent[]> {
  const events: AgentEvent[] = [];
  for await (const ev of streamAgentQuery(input)) events.push(ev);
  return events;
}

describe('extractContextOptions from streamed text', () => {
  it('parses a scheme_selection json block into a context_options event', async () => {
    const markdown = `Which scheme?\n\n\`\`\`json\n${SCHEME_OPTIONS_JSON}\n\`\`\``;
    const line = JSON.stringify({ content: { parts: [{ text: markdown }] } });
    globalThis.fetch = vi.fn().mockResolvedValue(ndjsonResponse([line]));

    const events = await collectEvents();
    const optionEvents = events.filter((e) => e.type === 'context_options');

    expect(optionEvents).toHaveLength(1);
    const options = (optionEvents[0] as { options: { type: string; schemes: unknown[] } }).options;
    expect(options.type).toBe('scheme_selection');
    expect(options.schemes).toHaveLength(2);
  });

  it('ignores unrelated json code blocks', async () => {
    const line = JSON.stringify({
      content: { parts: [{ text: '```json\n{"foo": "bar"}\n```' }] },
    });
    globalThis.fetch = vi.fn().mockResolvedValue(ndjsonResponse([line]));

    const events = await collectEvents();
    expect(events.filter((e) => e.type === 'context_options')).toHaveLength(0);
  });

  it('returns null for plain text without any code block', async () => {
    const line = JSON.stringify({ content: { parts: [{ text: 'just text' }] } });
    globalThis.fetch = vi.fn().mockResolvedValue(ndjsonResponse([line]));

    const events = await collectEvents();
    expect(events.filter((e) => e.type === 'context_options')).toHaveLength(0);
  });

  it('skips malformed context json instead of crashing', async () => {
    const line = JSON.stringify({
      content: { parts: [{ text: '```json\n{"type":"scheme_selection", broken\n```' }] },
    });
    globalThis.fetch = vi.fn().mockResolvedValue(ndjsonResponse([line]));

    const events = await collectEvents();
    expect(events.filter((e) => e.type === 'context_options')).toHaveLength(0);
    expect(events[events.length - 1]).toEqual({ type: 'done' });
  });
});

describe('session event emission', () => {
  it('emits a session event with the provided session id', async () => {
    const line = JSON.stringify({ content: { parts: [{ text: 'hello' }] } });
    globalThis.fetch = vi.fn().mockResolvedValue(ndjsonResponse([line]));

    const events = await collectEvents({ userId: 'u', message: 'hi', sessionId: 's-existing' });

    expect(events[0]).toEqual({ type: 'session', sessionId: 's-existing' });
  });

  it('does not derive a session id from the per-event uuid', async () => {
    const eventWithId = JSON.stringify({
      id: 'per-event-uuid-not-a-session-id',
      content: { parts: [{ text: 'x' }] },
    });
    globalThis.fetch = vi.fn().mockResolvedValue(ndjsonResponse([eventWithId]));

    const events = await collectEvents({ userId: 'u', message: 'hi', sessionId: 's-real' });

    const sessionIds = events
      .filter((e) => e.type === 'session')
      .map((e) => (e as { sessionId: string }).sessionId);
    expect(sessionIds).toEqual(['s-real']);
  });
});
