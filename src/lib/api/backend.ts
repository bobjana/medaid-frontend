export type ChatBackend = 'gcp' | 'local';

export function getChatBackend(): ChatBackend {
  return process.env.CHAT_BACKEND === 'local' ? 'local' : 'gcp';
}

export function getLocalBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';
}

export function logChatBackend(): void {
  const backend = getChatBackend();
  const target =
    backend === 'local' ? getLocalBackendUrl() : 'Vertex AI Agent Engine (GCP)';
  console.log(`[medaid] chat backend: ${backend} -> ${target}`);
}
