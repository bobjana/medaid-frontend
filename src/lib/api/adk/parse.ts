import type { Citation, ContextOptions } from '@/types';

export function extractText(event: unknown): string {
  if (!event || typeof event !== 'object') return '';
  const content = (event as { content?: unknown }).content;
  if (!content || typeof content !== 'object') return '';
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return '';
  let out = '';
  for (const p of parts) {
    if (p && typeof p === 'object' && 'text' in p && typeof (p as { text: unknown }).text === 'string') {
      out += (p as { text: string }).text;
    }
  }
  return out;
}

const CITATION_BLOCK_RE =
  /Source:\s*([^\n]+)\nSource URI:\s*(\S+)\nDownload:\s*(\S+)/g;

export function extractCitations(event: unknown): Citation[] {
  if (!event || typeof event !== 'object') return [];
  const content = (event as { content?: unknown }).content;
  if (!content || typeof content !== 'object') return [];
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return [];

  const citations: Citation[] = [];
  const seen = new Set<string>();
  for (const p of parts) {
    if (!p || typeof p !== 'object') continue;
    const fr = (p as { function_response?: unknown }).function_response;
    if (!fr || typeof fr !== 'object') continue;
    const response = (fr as { response?: unknown }).response;
    if (!response || typeof response !== 'object') continue;
    const result = (response as { result?: unknown }).result;
    if (typeof result !== 'string') continue;

    CITATION_BLOCK_RE.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = CITATION_BLOCK_RE.exec(result)) !== null) {
      const title = match[1].trim();
      const uri = match[2];
      const url = match[3];
      if (seen.has(url)) continue;
      seen.add(url);
      citations.push({ title, url, uri });
    }
  }
  return citations;
}

const CONTEXT_OPTIONS_RE = /```json\s*(\{[\s\S]*?"type"\s*:\s*"(?:scheme_selection|plan_selection)"[\s\S]*?\})\s*```/;

export function extractContextOptions(event: unknown): ContextOptions | null {
  if (!event || typeof event !== 'object') return null;
  const content = (event as { content?: unknown }).content;
  if (!content || typeof content !== 'object') return null;
  const parts = (content as { parts?: unknown }).parts;
  if (!Array.isArray(parts)) return null;

  for (const p of parts) {
    if (!p || typeof p !== 'object') continue;
    const text = (p as { text?: unknown }).text;
    if (typeof text !== 'string') continue;

    const match = CONTEXT_OPTIONS_RE.exec(text);
    if (!match) continue;

    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.type === 'scheme_selection' || parsed.type === 'plan_selection') {
        return parsed as ContextOptions;
      }
    } catch { /* ignore malformed JSON */ }
  }
  return null;
}
