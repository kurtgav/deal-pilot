import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { pickSttTransport } from './transport.js';

describe('pickSttTransport', () => {
  it('uses the browser transport when Web Speech is available', () => {
    assert.equal(pickSttTransport(true), 'browser');
  });

  it('falls back to deepgram when Web Speech is absent (Safari/Firefox)', () => {
    assert.equal(pickSttTransport(false), 'deepgram');
  });

  it('honors an explicit override regardless of availability', () => {
    assert.equal(pickSttTransport(true, 'deepgram'), 'deepgram');
    assert.equal(pickSttTransport(false, 'browser'), 'browser');
  });

  it("treats 'auto' / unknown overrides as auto-detect", () => {
    assert.equal(pickSttTransport(true, 'auto'), 'browser');
    assert.equal(pickSttTransport(false, ''), 'deepgram');
  });
});
