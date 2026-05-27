/**
 * WebScraper — fetches a company URL and key subpages, extracts meaningful
 * text content for AI agent pre-call context.
 */

const SCRAPE_TIMEOUT_MS = 8000;
const MAX_CONTENT_LENGTH = 4000;
const SUBPAGE_PATHS = ['/about', '/products', '/services', '/solutions', '/pricing', '/about-us'];

export async function scrapeCompanyUrl(url: string): Promise<string> {
  try {
    const baseUrl = normalizeUrl(url);
    const mainContent = await fetchPage(baseUrl);
    if (!mainContent) return `[Could not fetch ${url}]`;

    // Find and fetch key subpages
    const subpageLinks = discoverSubpages(mainContent.html, baseUrl);
    const subResults = await Promise.allSettled(
      subpageLinks.slice(0, 3).map((link) => fetchPage(link))
    );

    const sections: string[] = [extractStructured(mainContent.html, baseUrl)];
    for (const result of subResults) {
      if (result.status === 'fulfilled' && result.value) {
        const sub = extractStructured(result.value.html, result.value.url);
        if (sub.length > 50) sections.push(sub);
      }
    }

    const combined = sections.join('\n---\n').slice(0, MAX_CONTENT_LENGTH);
    return combined || `[No readable content found at ${url}]`;
  } catch (err: any) {
    return `[Scrape failed for ${url}: ${err?.message || 'unknown'}]`;
  }
}

function normalizeUrl(url: string): string {
  if (!url.startsWith('http')) url = 'https://' + url;
  return url.replace(/\/$/, '');
}

async function fetchPage(url: string): Promise<{ html: string; url: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DealPilot/1.0)', Accept: 'text/html' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    return { html: await res.text(), url };
  } catch {
    clearTimeout(timeout);
    return null;
  }
}

function discoverSubpages(html: string, baseUrl: string): string[] {
  const origin = new URL(baseUrl).origin;
  const found = new Set<string>();

  // Check common subpage paths
  for (const path of SUBPAGE_PATHS) {
    found.add(origin + path);
  }

  // Also extract links from the page that match key patterns
  const linkRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1];
    if (/about|product|service|solution|pricing|team|what-we-do/i.test(href)) {
      try {
        const full = href.startsWith('http') ? href : new URL(href, origin).href;
        if (full.startsWith(origin)) found.add(full);
      } catch { /* skip invalid URLs */ }
    }
  }

  return [...found];
}

function extractStructured(html: string, url: string): string {
  // Remove noise
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  const title = cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
  const metaDesc =
    cleaned.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
    cleaned.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)?.[1] || '';
  const ogDesc =
    cleaned.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1] || '';

  // Extract headings
  const headings: string[] = [];
  const hRegex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi;
  let m;
  while ((m = hRegex.exec(cleaned)) !== null) {
    const h = strip(m[1]);
    if (h.length > 3 && h.length < 200) headings.push(h);
  }

  // Extract paragraphs and list items
  const paragraphs: string[] = [];
  const pRegex = /<(?:p|li|blockquote|figcaption)[^>]*>([\s\S]*?)<\/(?:p|li|blockquote|figcaption)>/gi;
  while ((m = pRegex.exec(cleaned)) !== null) {
    const p = strip(m[1]);
    if (p.length > 25 && p.length < 500) paragraphs.push(p);
  }

  const parts: string[] = [];
  if (title) parts.push(`Company: ${strip(title)}`);
  if (metaDesc) parts.push(`About: ${metaDesc}`);
  else if (ogDesc) parts.push(`About: ${ogDesc}`);
  if (headings.length) parts.push(`Key topics: ${headings.slice(0, 10).join(' | ')}`);
  if (paragraphs.length) parts.push(`Content:\n${paragraphs.slice(0, 12).join('\n')}`);

  return parts.join('\n');
}

function strip(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}
