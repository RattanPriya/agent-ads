// Privacy-preserving measurement for agentic conversions.
// Replaces per-user click->conversion joins with:
//  1. k-anonymity gate (never report a bucket with < k events)
//  2. Laplace noise with a declared epsilon budget
//  3. No user ID, no cross-site join key in the report
// This is deliberately *not* a Chrome-only API: it is a plain
// JSON report any publisher / advertiser / auditor can verify.
// That matters after Google retired Protected Audience / Attribution
// Reporting / Private Aggregation in Oct 2025 (see README).

export function laplaceNoise(epsilon, sensitivity = 1) {
  // Inverse-CDF sampling. epsilon must be > 0; smaller = more privacy, more noise.
  if (!(epsilon > 0)) throw new Error('epsilon must be > 0');
  const u = Math.random() - 0.5;
  return - (sensitivity / epsilon) * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * @param {object} bucket { key:string, count:number, sumUSD:number }
 * @param {object} opts { k, epsilon }
 */
export function privatizeBucket(bucket, opts = {}) {
  const k = opts.k ?? 50;
  const epsilon = opts.epsilon ?? 1.0;
  if (bucket.count < k) return { key: bucket.key, suppressed: true, reason: `count ${bucket.count} < k=${k}` };
  return {
    key: bucket.key,
    suppressed: false,
    countNoisy: Math.max(0, Math.round(bucket.count + laplaceNoise(epsilon))),
    sumUSDNoisy: Math.round((bucket.sumUSD + laplaceNoise(epsilon, 10)) * 100) / 100,
    epsilon, k,
  };
}
