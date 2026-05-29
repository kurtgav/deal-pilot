import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { RBACClient } from './RBACClient.js';

/**
 * Build a fake JWT (header.payload.signature) for testing only.
 * jwt-decode does NOT verify signatures, so a placeholder is fine.
 */
function makeJwt(payload: Record<string, unknown>): string {
  const b64 = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header = b64({ alg: 'HS256', typ: 'JWT' });
  const body = b64(payload);
  return `${header}.${body}.signature-not-validated`;
}

const futureExp = Math.floor(Date.now() / 1000) + 60 * 60; // +1h
const pastExp = Math.floor(Date.now() / 1000) - 60; // -1m

describe('RBACClient', () => {
  describe('null / empty input', () => {
    it('treats null as logged-out user', () => {
      const r = new RBACClient(null);
      assert.equal(r.isAuthenticated(), false);
      assert.equal(r.getUserId(), null);
      assert.deepEqual(r.getRoles(), []);
      assert.deepEqual(r.getPermissions(), []);
      assert.equal(r.hasRole('admin'), false);
      assert.equal(r.hasPermission('documents.read'), false);
      assert.equal(r.isSuperAdmin(), false);
    });

    it('treats undefined as logged-out', () => {
      const r = new RBACClient(undefined);
      assert.equal(r.isAuthenticated(), false);
    });

    it('treats empty string as logged-out', () => {
      const r = new RBACClient('');
      assert.equal(r.isAuthenticated(), false);
    });

    it('treats malformed token as logged-out without throwing', () => {
      const r = new RBACClient('not.a.real.jwt');
      assert.equal(r.isAuthenticated(), false);
      assert.deepEqual(r.getRoles(), []);
    });

    it('accepts session-like object with null access_token', () => {
      const r = new RBACClient({ access_token: null });
      assert.equal(r.isAuthenticated(), false);
    });
  });

  describe('valid JWT', () => {
    const token = makeJwt({
      sub: 'user-123',
      exp: futureExp,
      user_roles: ['admin', 'manager'],
      user_permissions: ['documents.read', 'documents.create', 'users.read'],
    });

    it('reports authenticated for unexpired token', () => {
      const r = new RBACClient(token);
      assert.equal(r.isAuthenticated(), true);
      assert.equal(r.getUserId(), 'user-123');
    });

    it('returns the roles array', () => {
      const r = new RBACClient(token);
      assert.deepEqual(r.getRoles(), ['admin', 'manager']);
    });

    it('returns the permissions array', () => {
      const r = new RBACClient(token);
      assert.deepEqual(
        r.getPermissions(),
        ['documents.read', 'documents.create', 'users.read'],
      );
    });

    it('hasRole / hasAnyRole work correctly', () => {
      const r = new RBACClient(token);
      assert.equal(r.hasRole('admin'), true);
      assert.equal(r.hasRole('super_admin'), false);
      assert.equal(r.hasAnyRole(['super_admin', 'admin']), true);
      assert.equal(r.hasAnyRole(['super_admin', 'user']), false);
    });

    it('hasPermission / hasAnyPermission / hasAllPermissions work', () => {
      const r = new RBACClient(token);
      assert.equal(r.hasPermission('documents.read'), true);
      assert.equal(r.hasPermission('documents.delete'), false);
      assert.equal(
        r.hasAnyPermission(['billing.manage', 'documents.read']),
        true,
      );
      assert.equal(
        r.hasAllPermissions(['documents.read', 'documents.create']),
        true,
      );
      assert.equal(
        r.hasAllPermissions(['documents.read', 'documents.delete']),
        false,
      );
    });

    it('isSuperAdmin returns false for non-super_admin', () => {
      const r = new RBACClient(token);
      assert.equal(r.isSuperAdmin(), false);
    });

    it('hasAllPermissions on empty input returns true (vacuous truth)', () => {
      const r = new RBACClient(token);
      assert.equal(r.hasAllPermissions([]), true);
    });

    it('accepts session-like object', () => {
      const r = new RBACClient({ access_token: token });
      assert.equal(r.hasPermission('documents.read'), true);
    });

    it('defensive copy of arrays — mutation doesn\'t affect cached state', () => {
      const r = new RBACClient(token);
      const roles = r.getRoles();
      roles.push('hacker');
      assert.deepEqual(r.getRoles(), ['admin', 'manager']);
    });
  });

  describe('expired JWT', () => {
    const token = makeJwt({
      sub: 'user-456',
      exp: pastExp,
      user_roles: ['admin'],
      user_permissions: ['documents.read'],
    });

    it('isAuthenticated returns false', () => {
      const r = new RBACClient(token);
      assert.equal(r.isAuthenticated(), false);
    });

    it('still exposes claim data (apps decide how to react)', () => {
      const r = new RBACClient(token);
      assert.equal(r.getUserId(), 'user-456');
      assert.deepEqual(r.getRoles(), ['admin']);
    });
  });

  describe('super_admin detection', () => {
    const token = makeJwt({
      sub: 'sa-1',
      exp: futureExp,
      user_roles: ['super_admin'],
      user_permissions: ['roles.manage'],
    });

    it('isSuperAdmin returns true', () => {
      const r = new RBACClient(token);
      assert.equal(r.isSuperAdmin(), true);
    });
  });
});
