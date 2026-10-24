# Agent Ads — AATAP 0.1 reference implementation (DRAFT, local only)

Written on Rattan's behalf, Oct 24, 2026. **Nothing here has been submitted to Prebid, W3C, IAB, or GitHub.**
Held for Rattan's + counsel's review.

## Run it
```
node examples/demo.js
npm test
```
No dependencies. Node 18+.

## What it is
A runnable reference for the flagship standard in `spec/AATAP-01.md`:
Agentic Ad Transparency & Approval Protocol — authenticate the *agent* in a programmatic
transaction, require approval for consequential agent actions, and measure without a user ID.

Files:
- `src/agent-identity.js` — actorType / principal / attestation, rejects user IDs and undisclosed sponsorship
- `src/approval-policy.js` — $50 single / $100 cumulative anti-splitting rule, always-approval actions
- `src/latency-budget.js` — deadline-boxed on-device scoring with recorded fallback (WebNN #902/#934 application)
- `src/privacy-measurement.js` — k=50 suppression + Laplace noise, browser-independent
- `src/openrtb-extension.js` — maps all of it to `bidRequest.ext.agent`, OpenRTB-compatible
- `examples/agent-ads.json` — publisher-side `/.well-known/agent-ads.json` declaration
- `spec/AATAP-01.md` — full draft spec, gaps vs. existing work, and evidence plan

## Verified Oct 24
- 7/7 tests pass (`npm test`)
- Demo: $120 sponsored user-agent purchase → requiresApproval=true; 3×$40 split → approval;
  slow model (200ms) under 30ms low-tier budget → fallback score 0.5; bucket count 12 < k=50 → suppressed.
