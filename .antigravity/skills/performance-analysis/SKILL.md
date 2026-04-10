---
name: performance-analysis
description: Structured methodology for analyzing checkout performance using Sentry traces, Web Vitals, and resource breakdowns. Covers merchant comparison, 3rd-party script impact, long task analysis, CLS diagnosis, and actionable recommendations. Use when investigating slow merchants, performance complaints, or Web Vitals degradation.
version: 1.0.0
last_updated: 2026-02-25
---

# Checkout Performance Analysis

## When to Use

- Merchant reports slow checkout performance
- Comparing performance between merchants
- Investigating Web Vitals degradation (LCP, FCP, CLS, TTFB)
- Analyzing 3rd-party script impact
- Building a performance case for merchant or engineering action

## Step-by-Step Methodology

### Step 1: Gather Aggregate Data (24h)

Use Sentry MCP to get aggregate Web Vitals:

```
search_events(organizationSlug='global-e-yb', projectSlug='javascript-classic-checkout',
  naturalLanguageQuery='average LCP, FCP, TTFB, CLS for merchantId:{ID} pageload transactions last 24h')
```

**Key metrics to capture:**
| Metric | Good | Needs Improvement | Poor |
|--------|:----:|:-----------------:|:----:|
| LCP | <2.5s | 2.5-4s | >4s |
| FCP | <1.8s | 1.8-3s | >3s |
| CLS | <0.1 | 0.1-0.25 | >0.25 |
| TTFB | <800ms | 800-1800ms | >1800ms |

### Step 2: Get Percentile Distribution (7d)

Query p75 and p95 pageload durations to understand the tail:
- p75 shows typical slow experience
- p95 shows worst-case (often reveals 3rd-party impact under poor networks)

### Step 3: Deep-Dive Specific Traces

Pick 2-3 representative traces (1 typical, 1 slow, 1 fast) and analyze:

```
get_trace_details(organizationSlug='global-e-yb', traceId='...')
```

For each trace, catalog:
- **resource.script** — Count and durations (identify 3rd-party extras)
- **resource.img** — Count and heaviest images (likely LCP candidates)
- **resource.css** — Count
- **ui.long-task** — Count and total blocking time
- **http.client** — Count and slowest calls
- **resource.iframe** — Credit card form iframe duration

### Step 4: Identify 3rd-Party Scripts

Compare script lists between merchants. Common 3rd-party offenders:

| Script | Typical Impact | Category |
|--------|:-------------:|----------|
| Allyable accessibility widget | ~1,675ms | A11y overlay (loads own jQuery!) |
| FullStory session recording | ~1,168ms | Analytics (records + uploads immediately) |
| PayPal SDK (eager load) | ~809ms | Payment (loads before user selects PayPal) |
| ContentSquare analytics | ~244ms | Analytics |
| Forter fraud detection | ~600-2,800ms | Security (varies by network) |

**Baseline scripts** (always present): `checkoutv2_top.js`, `checkoutv2_bottom_handle_actions.js`, `globale-analytics-sdk`, `Sentry`, `Forter`, `widgetsAutocompleteScripts.js`, `widgetsLightcomboboxScripts.js`, `widgetsThirdpartyScripts.js`

### Step 5: Analyze Long Tasks

Long tasks (>50ms) block the main thread. Catalog by duration:
- >500ms: Critical — likely script parsing on slow device
- 200-500ms: Significant
- 100-200ms: Moderate
- 50-100ms: Minor but cumulative

**Rule of thumb:** >5 long tasks or >1s total blocking = performance issue.

### Step 6: Diagnose CLS

Common CLS sources in Global-E checkout:
1. PayPal button rendering late after SDK loads
2. 3rd-party overlays injecting UI after initial paint
3. Heavy product images without explicit dimensions
4. Credit card iframe resizing

### Step 7: Check Server-Side (HandleAction)

Compare server spans to confirm whether issue is server or client:
- `handleaction/shippingoptions`
- `handleaction/totals`
- `handleaction/taxoptions`

If server is fast but pageload is slow → client-side issue (3rd-party scripts, images, device).

### Step 8: Build Recommendations

**Categorize by owner:**

| Owner | Action Type | Example |
|-------|------------|---------|
| **Merchant** | 3rd-party script optimization | Defer Allyable, lazy-load PayPal SDK |
| **Merchant** | Image optimization | WebP/AVIF, responsive sizing |
| **Global-E Engineering** | Platform optimization | Batch analytics pixels, `navigator.sendBeacon()` |
| **Global-E Engineering** | Script loading | Lazy-load payment SDKs per selected method |

## Report Template

```markdown
# Performance Analysis: Merchant {ID} ({Name})

## Executive Summary
[1-2 sentences: root cause + impact]

## Aggregate Web Vitals (24h)
| Metric | Value | Rating |
[...]

## Trace Analysis
[Resource breakdown, 3rd-party identification, long tasks]

## Root Causes (Ranked by Impact)
1. [Cause] — [Impact] — [Confidence]

## Recommendations
### Immediate (Merchant)
### Platform-Level (Engineering)

## Sentry Links
[Trace URLs for follow-up]
```

## Reference: Montblanc (1978) vs 613 Case Study

A detailed example of this methodology applied: Merchant 1978 had +74% worse LCP caused entirely by 5 extra 3rd-party scripts (+2.3s download) and 3.7x more long tasks. Server was actually 2x faster. See `SKILSS/performance-analysis/` for the full 621-line analysis.
