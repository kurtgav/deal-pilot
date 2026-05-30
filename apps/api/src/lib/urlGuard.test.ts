import { describe, it, expect } from 'vitest';
import { isPrivateIp, assertSafeUrl } from './urlGuard.js';

describe('isPrivateIp', () => {
  it('flags private/loopback/link-local/metadata addresses', () => {
    for (const ip of ['127.0.0.1', '10.0.0.5', '172.16.0.1', '192.168.1.1', '169.254.169.254', '0.0.0.0', '::1', 'fe80::1', 'fc00::1']) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
  });
  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '93.184.216.34']) {
      expect(isPrivateIp(ip), ip).toBe(false);
    }
  });
});

describe('assertSafeUrl', () => {
  it('rejects non-http(s) schemes', async () => {
    await expect(assertSafeUrl('file:///etc/passwd')).rejects.toThrow(/scheme/i);
    await expect(assertSafeUrl('ftp://example.com')).rejects.toThrow(/scheme/i);
  });
  it('rejects IP-literal hosts in private ranges (incl. cloud metadata)', async () => {
    await expect(assertSafeUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow(/private/i);
    await expect(assertSafeUrl('http://127.0.0.1:3001/api/health')).rejects.toThrow(/private/i);
  });
  it('accepts a public IP-literal http(s) URL', async () => {
    await expect(assertSafeUrl('https://8.8.8.8/')).resolves.toBeInstanceOf(URL);
  });
});
