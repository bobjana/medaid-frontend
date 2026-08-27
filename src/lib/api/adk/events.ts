import type { Citation, ContextOptions } from '@/types';

export type AgentEvent =
  | { type: 'text'; delta: string }
  | { type: 'citations'; citations: Citation[] }
  | { type: 'session'; sessionId: string }
  | { type: 'context_options'; options: ContextOptions }
  | { type: 'done' }
  | { type: 'error'; message: string };
