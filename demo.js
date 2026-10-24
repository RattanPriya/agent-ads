import { toOpenRTBExt, scoreWithBudget, selectModelVariant, privatizeBucket } from '../src/index.js';

// 1. A user-delegated agent, disclosed as sponsored, wants a $120 purchase.
const manifest = {
  actorType: 'user-agent', principalType: 'user',
  attestationMethod: 'webmcp-tool', sponsored: true,
  sponsorDisclosure: 'Ranking boosted by Example Store sponsorship, disclosed to user',
  delegationChain: [{ role: 'user' }, { role: 'browser-agent' }],
};
const ext = toOpenRTBExt(manifest, [
  { action: 'search', amountUSD: 0 },
  { action: 'purchase', amountUSD: 120 },
]);
console.log('OpenRTB ext:', JSON.stringify(ext, null, 2));
console.log('-> requiresApproval should be true (purchase + $120):', ext.agent.approval.requiresApproval);

// 2. Anti-splitting: three $40 purchases = $120 cumulative, still needs approval.
import { evaluateApproval } from '../src/approval-policy.js';
console.log('Anti-splitting:', evaluateApproval([
  { action: 'purchase', amountUSD: 40 }, { action: 'purchase', amountUSD: 40 }, { action: 'purchase', amountUSD: 40 },
]));

// 3. Latency-budgeted scoring: slow model falls back, fast model scores.
const slow = () => new Promise(r => setTimeout(() => r(0.91), 200));
console.log('Slow model:', await scoreWithBudget(slow, { budgetMs: 50, fallbackScore: 0.5, deviceTier: 'low' }));
console.log('Model variant for WebNN device:', selectModelVariant({ webnn: true, computeUnits: 8 }));

// 4. Privacy measurement: small bucket suppressed, large bucket noised.
console.log('Small bucket:', privatizeBucket({ key: 'campaign-A', count: 12, sumUSD: 300 }, { k: 50 }));
console.log('Large bucket:', privatizeBucket({ key: 'campaign-B', count: 1200, sumUSD: 24000 }, { k: 50 }));
