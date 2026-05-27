/**
 * WebScraper — fetches a company URL and extracts meaningful text content
 * for use as context in AI agent calls. No heavy dependencies; uses native fetch
 * and regex-based HTML stripping.
 */

const SCRAPE_TIMEOUT_MS = 10000;
const MAX_CONTENT_LENGTH = 3000; // chars to keep for prompt injection

export async function scrapeCompanyUrl(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'DealPilot-Bot/1.0 (sales-context-scraper)',
        Accept: 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return `[Could not fetch ${url}: HTTP ${res.status}]`;

    const html = await res.text();
    const text = extractText(html);
    if (!text.trim()) return `[No readable content found at ${url}]`;

    return text.slice(0, MAX_CONTENT_LENGTH);
  } catch (err: any) {
    if (err?.name === 'AbortError') return `[Scrape timed out for ${url}]`;
    return `[Scrape failed for ${url}: ${err?.message || 'unknown error'}]`;
  }
}

function extractText(html: string): string {
  // Remove script, style, nav, footer, header tags and their content
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '');

  // Extract meta description and title
  const title = cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
  const metaDesc =
    cleaned.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
    cleaned.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)?.[1] ||
    '';

  // Extract headings
  const headings: string[] = [];
  const hRegex = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let match;
  while ((match = hRegex.exec(cleaned)) !== null) {
    const h = stripTags(match[1]).trim();
    if (h && h.length > 3) headings.push(h);
  }

  // Extract paragraph text
  const paragraphs: string[] = [];
  const pRegex = /<(?:p|li|td|div|span|article|section)[^>]*>([\s\S]*?)<\/(?:p|li|td|div|span|article|section)>/gi;
  while ((match = pRegex.exec(cleaned)) !== null) {
    const p = stripTags(match[1]).trim();
    if (p && p.length > 20) paragraphs.push(p);
  }

  const parts: string[] = [];
  if (title) parts.push(`Company: ${stripTags(title)}`);
  if (metaDesc) parts.push(`About: ${metaDesc}`);
  if (headings.length) parts.push(`Key points: ${headings.slice(0, 8).join('; ')}`);
  if (paragraphs.length) parts.push(`Details:\n${paragraphs.slice(0, 15).join('\n')}`);

  return parts.join('\n');
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}
