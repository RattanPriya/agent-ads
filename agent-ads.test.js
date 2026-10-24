import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAgentIdentity, evaluateApproval, scoreWithBudget, privatizeBucket, toOpenRTBExt } from '../src/index.js';

test('merchant agent posing as user is rejected', () => {
  const r = validateAgentIdentity({ actorType: 'user-agent', principalType: 'merchant', attestationMethod: 'none', sponsored: false });
  assert.equal(r.valid, false);
});
test('sponsored without disclosure is rejected; with disclosure passes', () => {
  assert.equal(validateAgentIdentity({ actorType: 'merchant-agent', principalType: 'merchant', attestationMethod: 'signed-manifest', sponsored: true }).valid, false);
  assert.equal(validateAgentIdentity({ actorType: 'merchant-agent', principalType: 'merchant', attestationMethod: 'signed-manifest', sponsored: true, sponsorDisclosure: 'Paid by X' }).valid, true);
});
test('user identifiers are rejected', () => {
  const r = validateAgentIdentity({ actorType: 'user-agent', principalType: 'user', attestationMethod: 'webmcp-tool', sponsored: false, userId: '123' });
  assert.equal(r.valid, false);
});
test('anti-splitting triggers approval', () => {
  const r = evaluateApproval([{ action: 'purchase', amountUSD: 40 }, { action: 'purchase', amountUSD: 40 }, { action: 'purchase', amountUSD: 40 }]);
  assert.equal(r.requiresApproval, true);
});
test('latency budget falls back on timeout', async () => {
  const slow = () => new Promise(r => setTimeout(() => r(0.9), 200));
  const out = await scoreWithBudget(slow, { budgetMs: 20, fallbackScore: 0.5 });
  assert.equal(out.path, 'fallback');
  assert.equal(out.score, 0.5);
});
test('small buckets are suppressed', () => {
  assert.equal(privatizeBucket({ key: 'x', count: 5, sumUSD: 10 }, { k: 50 }).suppressed, true);
});
test('OpenRTB ext carries no user identifier', () => {
  const ext = toOpenRTBExt({ actorType: 'user-agent', principalType: 'user', attestationMethod: 'webmcp-tool', sponsored: false }, [{ action: 'search', amountUSD: 0 }]);
  assert.equal(ext.agent.containsUserIdentifier, false);
});
