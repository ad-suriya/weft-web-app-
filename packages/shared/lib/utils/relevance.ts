// Lightweight local relevance scoring — no NLP dependency in the repo, and a
// keyword-overlap check is enough for the hackathon demo (task/step text vs.
// page title/URL/selection). Shared between the popup (This Page card) and
// the background worker (context-switch detection) — runs entirely
// client-side, nothing here is ever sent to the backend.

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'to', 'was',
  'will', 'with', 'this', 'your', 'you', 'i', 'my', 'we', 'our', 'not',
  'do', 'does', 'did', 'have', 'had', 'can', 'com', 'www', 'http', 'https',
]);

export const tokenize = (text: string): Set<string> => {
  const words = (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s/_-]/g, ' ')
    .split(/[\s/_-]+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
};

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const w of a) if (b.has(w)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

export type RelevanceVerdict = 'relevant' | 'switch' | 'unknown';

export interface RelevanceResult {
  score: number;
  verdict: RelevanceVerdict;
}

// Below this, the page looks unrelated to the current work.
const RELEVANCE_THRESHOLD = 0.08;

export function scoreRelevance(
  task: { name: string; stepText?: string },
  page: { title: string; url?: string; selectedText?: string },
): RelevanceResult {
  const taskTokens = new Set<string>([
    ...tokenize(task.name),
    ...tokenize(task.stepText || ''),
  ]);
  if (taskTokens.size === 0) return { score: 0, verdict: 'unknown' };

  let urlPath = '';
  try {
    urlPath = page.url ? new URL(page.url).pathname : '';
  } catch {
    // not a parseable URL — ignore
  }
  const pageTokens = new Set<string>([
    ...tokenize(page.title),
    ...tokenize(urlPath),
    ...tokenize(page.selectedText || ''),
  ]);
  if (pageTokens.size === 0) return { score: 0, verdict: 'unknown' };

  const score = jaccard(taskTokens, pageTokens);
  return { score, verdict: score >= RELEVANCE_THRESHOLD ? 'relevant' : 'switch' };
}
