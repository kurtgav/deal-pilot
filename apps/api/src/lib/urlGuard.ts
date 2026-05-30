import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

/**
 * SSRF guard for outbound fetches of user-supplied URLs (e.g. lead.companyUrl).
 * Blocks non-http(s) schemes and any host that resolves to a private,
 * loopback, link-local, or otherwise non-public address — which would
 * otherwise let a crafted URL reach internal services (e.g. the cloud
 * metadata endpoint 169.254.169.254) or localhost.
 */

/** True if an IP literal is in a private/loopback/link-local/reserved range. */
export function isPrivateIp(ip: string): boolean {
  const v = isIP(ip);
  if (v === 4) return isPrivateV4(ip);
  if (v === 6) return isPrivateV6(ip.toLowerCase());
  return true; // not a valid IP → treat as unsafe
}

function isPrivateV4(ip: string): boolean {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return (
    a === 0 || a === 10 || a === 127 || // unspecified, private, loopback
    (a === 169 && b === 254) ||         // link-local incl. cloud metadata
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    a >= 224                              // multicast + reserved
  );
}

function isPrivateV6(ip: string): boolean {
  if (ip === '::' || ip === '::1') return true;          // unspecified, loopback
  if (ip.startsWith('fe80') || ip.startsWith('fc') || ip.startsWith('fd')) return true; // link-local, ULA
  const mapped = ip.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
  if (mapped) return isPrivateV4(mapped[1]);
  return false;
}

/** Throws if the URL is not a safe, public http(s) target. Returns the parsed URL. */
export async function assertSafeUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('Invalid URL');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Blocked scheme: ${url.protocol}`);
  }
  // If host is an IP literal, check directly; otherwise resolve it.
  if (isIP(url.hostname)) {
    if (isPrivateIp(url.hostname)) throw new Error('Blocked private address');
    return url;
  }
  const addrs = await lookup(url.hostname, { all: true });
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) {
    throw new Error('Blocked private address');
  }
  return url;
}
