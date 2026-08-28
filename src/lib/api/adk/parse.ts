import type { Citation, ContextOptions, PlanOption, SchemeOption } from '@/types';

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

const JSON_FENCE_RE = /```(?:json)?\s*(\{[\s\S]*\})\s*```/;

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

    const match = JSON_FENCE_RE.exec(text);
    if (!match) continue;

    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1]);
    } catch { continue; }
    if (!parsed || typeof parsed !== 'object') continue;

    const obj = parsed as { type?: unknown; schemes?: unknown; plans?: unknown; scheme?: unknown };
    const type =
      obj.type === 'scheme_selection' || obj.type === 'plan_selection'
        ? obj.type
        : Array.isArray(obj.schemes) && obj.schemes.length > 0
          ? 'scheme_selection'
          : Array.isArray(obj.plans) && obj.plans.length > 0
            ? 'plan_selection'
            : null;
    if (!type) continue;

    return {
      type,
      schemes: Array.isArray(obj.schemes) ? (obj.schemes as SchemeOption[]) : undefined,
      plans: Array.isArray(obj.plans) ? (obj.plans as PlanOption[]) : undefined,
      scheme: typeof obj.scheme === 'string' ? obj.scheme : undefined,
    };
  }
  return null;
}
