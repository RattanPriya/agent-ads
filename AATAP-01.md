# AATAP 0.1 — Agentic Ad Transparency & Approval Protocol (DRAFT)

Status: Draft written by Pax on Rattan's behalf, Oct 24, 2026. **Not submitted, not adopted, not filed.**
Held for Rattan's and Ogletree Deakins' review. Nothing in this repo is sent anywhere unless Rattan explicitly says so.

## Problem, in one paragraph
Programmatic auctions authenticate sellers (ads.txt, sellers.json, SupplyChain) and, until recently, measured
with browser APIs (Protected Audience, Attribution Reporting). They do not authenticate *agents*.
In the agentic web — WebMCP tools calling checkout on a user's behalf — a bid request cannot distinguish
a user-delegated purchase from a merchant agent steering a ranking, or from an agent splitting a $120
purchase into three $40 calls to dodge approval. That is a fraud, disclosure, and consumer-protection gap,
not a targeting gap.

## What is new here (vs. existing work)
- **ads.txt / sellers.json / SupplyChain (IAB Tech Lab):** authenticate the sell side. AATAP authenticates the *agent* side. Complementary, not a replacement.
- **adagents.json (proposed Mar 2026, Brian O'Kelley, as an ads.txt successor):** also agent-facing. AATAP differs by (1) binding agent identity to an OpenRTB `ext.agent` object, (2) adding a cumulative approval / anti-splitting rule, and (3) adding a latency-budgeted on-device scoring rule. If adagents.json moves first, AATAP should be positioned as its auction + approval extension, not a rival file — counsel / WG chairs decide that framing.
- **WebMCP (W3C WebML CG, Draft Community Group Report, Chrome 149 origin trial):** defines tools. AATAP defines what tools *may not do silently* — approval, sponsorship disclosure, delegation.
- **WebNN #902 / #934 (device selection, latency):** AATAP's latency-budget module is the ad-auction application of that idea: a scoring model with a deadline and a recorded fallback path.
- **Privacy Sandbox (Protected Audience, Attribution Reporting, Private Aggregation):** Google announced retirement / phase-out of these in Oct 2025. AATAP's measurement module is intentionally browser-independent, so it does not die with a single vendor's API.

## Wire format
- Publisher declaration: `/.well-known/agent-ads.json` (see examples/agent-ads.json)
- Bid request: `bidRequest.ext.agent` (see src/openrtb-extension.js + AGENT_EXT_SCHEMA)
- Approval: single-action ≥ $50, session cumulative ≥ $100, or 3+ purchases ≥ $50 cumulative, or always for subscription / purchase / payment / account / data-export — all thresholds are policy inputs, not hard-coded law.

## Implementation path (in order, each step is independently citable)
1. This reference implementation + tests (done, local only).
2. Prebid.js bidder-adapter / RTD module sketch: copy `ext.agent` into the bid request; drop bids whose agent identity fails validation.
3. Prebid Server (Go) bidder extension: same validation server-side.
4. W3C WebML CG issue: propose `ext.agent` + approval as a WebMCP companion note, citing the WebMCP #288 approval-bypass thread and WebNN #902 latency thread — *only* after Rattan reviews the draft.
5. IAB Tech Lab OpenProposal issue: propose `ext.agent` as an OpenRTB extension, framed as complementary to adagents.json if that proposal is live.

## How EB-1A "original contributions of major significance" would be evidenced — counsel decides
USCIS does not grant this criterion for writing code alone. The usual evidence pattern is:
independent adoption or implementation, citations / discussion by others, and specific letters from
independent experts explaining *why* the contribution mattered and *how* it was used — not generic praise.
That was the exact failure mode in the prior denial (7 letters read as generic praise). So the plan
for any of these standards must be: ship a usable reference, get a real implementer or WG discussion
on the record, *then* ask for letters that cite that record. Do not reverse the order.

## Open questions for Rattan
1. Thresholds: keep $50 / $100, or align to a payment-network / platform threshold you already use?
2. Name: AATAP, or fold it under adagents.json as an extension?
3. First venue: W3C WebML, IAB Tech Lab, or Prebid community? Pick one; do not file in three places at once.
