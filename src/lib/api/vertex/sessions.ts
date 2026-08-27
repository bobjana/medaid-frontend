import { getVertexConfig } from './env';
import { getAuthToken } from './auth';
import { randomUUID } from '@/lib/utils';

const SESSION_ID_RE = /^[a-z][a-z0-9-]*[a-z0-9]$/;

function generateSessionId(): string {
  return 's-' + randomUUID();
}

function isValidSessionId(id: string): boolean {
  return id.length <= 63 && SESSION_ID_RE.test(id);
}

function getSessionsUrl(): string {
  const { project, region, agentEngineId } = getVertexConfig();
  return `https://${region}-aiplatform.googleapis.com/v1/projects/${project}/locations/${region}/reasoningEngines/${agentEngineId}/sessions`;
}

export async function createSession(userId: string): Promise<string> {
  const token = await getAuthToken();
  const session_id = generateSessionId();

  const url = new URL(getSessionsUrl());
  url.searchParams.set('sessionId', session_id);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ user_id: userId }),
  });

  if (!resp.ok) {
    const detail = await resp.text().catch(() => '');
    throw new Error(
      `CreateSession failed: ${resp.status} ${resp.statusText}${detail ? ` — ${detail}` : ''}`,
    );
  }

  const data = await resp.json();
  const sessionName: string | undefined = data.response?.name ?? data.name;
  if (typeof sessionName === 'string' && sessionName.includes('/sessions/')) {
    const id = sessionName.split('/').pop();
    if (id) return id;
  }
  return session_id;
}

export async function ensureSessionId(userId: string, existing?: string): Promise<string> {
  if (existing && isValidSessionId(existing)) {
    return existing;
  }
  return createSession(userId);
}
