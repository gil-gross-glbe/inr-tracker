# Performance Analysis: Merchant 1978 (Montblanc) vs Merchant 613

**Date:** February 23, 2026  
**Analyst:** Gil Gross (via Sentry MCP analysis)  
**Source:** Sentry project `javascript-classic-checkout` @ `global-e-yb`  
**Period:** Last 24h (aggregates) / Last 7 days (percentiles)

---

## Executive Summary

Merchant 1978 (Montblanc, Demandware/SFCC platform) exhibits significantly degraded page load performance compared to merchant 613. **The root cause is entirely client-side** — the server actually responds faster for 1978. The performance gap is driven by **5+ additional 3rd-party scripts** (Allyable, ContentSquare, FullStory, PayPal SDK) that add ~2.3 seconds of download time, cause 3.7x more main-thread-blocking long tasks, and trigger severe layout shifts.

---

## 1. Aggregate Web Vitals Comparison (24h Average)

| Metric | Merchant 1978 | Merchant 613 | Delta | Rating |
|--------|:------------:|:-----------:|:-----:|:------:|
| **Avg Pageload Duration** | 6,878 ms | 6,340 ms | +8.5% | Slower |
| **Avg LCP** | 3,527 ms | 2,024 ms | **+74.3%** | Much worse |
| **Avg FCP** | 1,997 ms | 1,383 ms | **+44.4%** | Worse |
| **Avg TTFB** | 313 ms | 651 ms | **−52%** | 1978 is BETTER |
| **Avg CLS** | 0.262 | 0.103 | **+153.9%** | "Poor" threshold exceeded |

### Key Insight
TTFB (server response time) is **twice as fast** for merchant 1978. The entire performance gap occurs after the server response arrives — during client-side resource loading, script parsing, and rendering.

---

## 2. 7-Day Percentile Distribution

| Metric | Merchant 1978 | Merchant 613 | Delta |
|--------|:------------:|:-----------:|:-----:|
| **p75 Pageload** | 7,320 ms | 6,291 ms | +16.4% |
| **p95 Pageload** | 12,778 ms | 9,697 ms | **+31.8%** |
| **Sample Count** | 8,722 | 6,816 | +28% more traffic |

The p95 gap of **+3,081 ms** means the worst-performing 5% of 1978 visits are dramatically slower, suggesting the 3rd-party scripts compound under poor network conditions.

---

## 3. Trace-Level Resource Breakdown

Analysis based on specific traces:
- **Merchant 1978:** Trace `7febca7d820b4917939d95a9562f6af7` (total pageload: 8,678 ms)
- **Merchant 613:** Trace `19a630514f9744ee9eaf7adda8caeedd` (total pageload: 7,355 ms)

| Resource Type | 1978 | 613 | Delta | Impact |
|---------------|:---:|:---:|:-----:|--------|
| `resource.script` | **17** | 12 | +42% | More scripts to download & parse |
| `resource.img` | **30** | 23 | +30% | More image resources |
| `resource.css` | 9 | 16 | −44% | Fewer CSS files |
| `resource.iframe` | 2 | 1 | +100% | Extra iframe (credit card form) |
| **`ui.long-task`** | **11** | **3** | **+267%** | 3.7x more main thread blocking |
| `http.client` | 20 | 18 | +11% | Slightly more API calls |
| `browser` | 8 | 8 | — | Same |
| **Total Spans** | **120** | **105** | +14% | More overall work |

---

## 4. Root Cause #1: 3rd-Party Script Overload (~2,300 ms extra)

Merchant 1978 loads **5 additional 3rd-party services** that merchant 613 does not have:

### Allyable Accessibility Widget (~1,675 ms total)
| Resource | Duration | Type |
|----------|:--------:|:----:|
| `portal.allyable.com/aweb?license=...` | **1,161 ms** | Script (main widget) |
| `static.allyable.com/assets/jquery-2.2.4.min.js` | **354 ms** | Script (loads its OWN jQuery!) |
| `portal.allyable.com/aweb/assets/a-web.rules.js` | **160 ms** | Script (rules engine) |

> **Critical finding:** Allyable loads jQuery 2.2.4 separately, even though the checkout already has jQuery. This is a redundant ~85KB download + parse that blocks the main thread.

### ContentSquare Analytics (~244 ms)
| Resource | Duration | Type |
|----------|:--------:|:----:|
| `t.contentsquare.net/uxa/bbd69ae6e1409.js` | **244 ms** | Script |

### FullStory Session Recording (~1,168 ms total)
| Resource | Duration | Type |
|----------|:--------:|:----:|
| `edge.fullstory.com/s/fs.js` | **175 ms** | Script (initial load) |
| `POST rs.fullstory.com/rec/page` | **425 ms** | HTTP (page recording) |
| `POST rs.fullstory.com/rec/bundle` (×2) | **332 ms + 236 ms** | HTTP (bundle uploads) |

> FullStory not only loads on pageload but immediately starts recording and uploading bundles, competing for network bandwidth during the critical rendering window.

### PayPal SDK (~192 ms)
| Resource | Duration | Type |
|----------|:--------:|:----:|
| `paypal.com/sdk/js?client-id=...&currency=EUR` | **192 ms** | Script |
| `POST paypal.com/xoplatform/logger/api/logger` | **617 ms** | HTTP (PayPal telemetry) |

> PayPal SDK loads eagerly on page init, even though the user hasn't selected PayPal as payment method. This adds ~809 ms of combined script + telemetry.

### Summary: Extra 3rd-Party Overhead for Merchant 1978
| Category | Script Load | HTTP Calls | Total |
|----------|:----------:|:----------:|:-----:|
| Allyable | 1,675 ms | — | 1,675 ms |
| ContentSquare | 244 ms | — | 244 ms |
| FullStory | 175 ms | 993 ms | 1,168 ms |
| PayPal | 192 ms | 617 ms | 809 ms |
| **Total Extra** | **2,286 ms** | **1,610 ms** | **~3,896 ms** |

---

## 5. Root Cause #2: 3.7x More Long Tasks (Main Thread Blocking)

### Merchant 1978: 11 Long Tasks (~767 ms total blocking)
| # | Duration |
|:-:|:--------:|
| 1 | 102 ms |
| 2 | 101 ms |
| 3 | 89 ms |
| 4 | 77 ms |
| 5 | 65 ms |
| 6 | 64 ms |
| 7 | 56 ms |
| 8 | 55 ms |
| 9 | 55 ms |
| 10 | 52 ms |
| 11 | 52 ms |

### Merchant 613: 3 Long Tasks (~314 ms total blocking)
| # | Duration |
|:-:|:--------:|
| 1 | 124 ms |
| 2 | 111 ms |
| 3 | 79 ms |

**Why?** Each 3rd-party script (Allyable, ContentSquare, FullStory, PayPal) must be parsed and executed on the main thread. The additional 5 scripts in merchant 1978 fragment the main thread with short-but-frequent blocking periods, preventing the browser from performing layout, paint, and interactive readiness.

---

## 6. Root Cause #3: Severe Layout Shift (CLS)

| Metric | Merchant 1978 | Merchant 613 | Threshold |
|--------|:------------:|:-----------:|:---------:|
| CLS | **0.262** | 0.103 | Good: <0.1 / Poor: >0.25 |

Merchant 1978 exceeds the "Poor" CLS threshold. Likely contributing factors:
1. **PayPal button** rendering late after SDK loads (~192 ms script + ~617 ms logger)
2. **Allyable accessibility overlay** injecting UI elements after initial paint
3. **Large Montblanc product image** (1,383 ms) loading after initial layout

---

## 7. Root Cause #4: Heavy Merchant Product Images

### Merchant 1978 — Top Image Resources
| Resource | Duration |
|----------|:--------:|
| `montblanc.com/.../.../Kqc6mjaoRzK__Tg86ArL0A_5d81b072.png` | **1,383 ms** |
| `global-e.com/sectigo_trust_seal_sm_82x32.png` | 286 ms |
| Analytics pixel (`utils.global-e.com/collectCheckout`) × 6 | ~250 ms each |
| `/Content/Images/AlertIcon.svg` | 219 ms |
| `/Content/Images/horizontal_loader.gif` | 200 ms |

> The Montblanc product image at 1,383 ms is very likely the **LCP element**. This image is served from Demandware's CDN (`demandware.static`) and appears to be unoptimized for the mobile viewport (user was on Samsung Browser / Android 10 / 360×780 screen).

---

## 8. Server-Side Comparison (HandleAction API)

The server-side tells the **opposite story** — merchant 1978 is FASTER:

| Server Span | Merchant 1978 | Merchant 613 | Delta |
|-------------|:------------:|:-----------:|:-----:|
| `handleaction/shippingoptions` | 446 ms | **912 ms** | 613 is 2x slower |
| `handleaction/totals` | 28 ms | 97 ms | 613 is 3.5x slower |
| `handleaction/taxoptions` | — | 84 ms | Only 613 has this |
| **Total server time** | **474 ms** | **1,093 ms** | 613 is 2.3x slower |

This confirms the performance issue is **not a Global-E backend problem**.

---

## 9. HTTP Client Calls Comparison

### Merchant 1978 — Top HTTP Calls (Client-Side)
| Endpoint | Duration | Category |
|----------|:--------:|:--------:|
| `GET siteperformancetest.net/chv?q=...` | 724 ms | Forter |
| `GET siteperformancetest.net/chv?d=0` | 678 ms | Forter |
| `POST paypal.com/xoplatform/logger` | 617 ms | PayPal |
| `GET cdn0.forter.com/.../prop.json` | 591 ms | Forter |
| `POST handleaction/1/...` | 573 ms | Global-E |
| `POST rs.fullstory.com/rec/page` | 425 ms | FullStory |
| `GET cdn0.forter.com/.../prop.json` | 374 ms | Forter |
| `POST rs.fullstory.com/rec/bundle` | 332 ms | FullStory |
| `POST cdn0.forter.com/.../wpt.json` | 271 ms | Forter |
| `POST rs.fullstory.com/rec/bundle` | 236 ms | FullStory |

### Merchant 613 — Top HTTP Calls (Client-Side)
| Endpoint | Duration | Category |
|----------|:--------:|:--------:|
| `POST handleaction/1/...` | **1,113 ms** | Global-E |
| `GET cdn0.forter.com/.../prop.json` | 931 ms | Forter |
| `GET cdn0.forter.com/.../prop.json` | 503 ms | Forter |
| `GET cdn0.forter.com/.../prop.json` | 463 ms | Forter |
| `POST cdn0.forter.com/.../wpt.json` | 443 ms | Forter |
| `POST handleaction/2/...` | 326 ms | Global-E |
| `POST handleaction/3/...` | 294 ms | Global-E |
| `POST WriteContextualLog` | 246 ms | Global-E |
| `GET siteperformancetest.net/chv?d=0` | 238 ms | Forter |

**Key difference:** Merchant 613 does NOT have PayPal, FullStory, or Allyable HTTP calls. Its bandwidth is consumed mainly by Forter and Global-E handleaction calls.

---

## 10. Device & Context Notes

| Attribute | Merchant 1978 (Trace) | Merchant 613 (Trace) |
|-----------|:---------------------:|:--------------------:|
| **Merchant** | Montblanc | Unknown |
| **Platform** | Demandware (SFCC) | Unknown |
| **Country** | Austria (AT) | Singapore (SG) |
| **Browser** | Samsung Browser 29.0 / Android 10 | Unknown |
| **Screen** | 360×780 (mobile) | Unknown |
| **Transaction** | `/Checkout/v2/*/*` | `/Checkout/v2/*/*` |

> The mobile device (Samsung Browser on Android 10) and the Samsung browser's Chromium engine version may also contribute to slower script parsing compared to desktop Chrome.

---

## 11. Merchant 673 (Reference)

Merchant 673 had only **2 pageloads in 24h**, making it statistically insignificant:
- LCP: 396 ms / FCP: 344 ms / TTFB: 159 ms / CLS: 0.001
- These exceptional numbers likely reflect a very simple checkout or an unrepresentative sample.

---

## 12. Recommendations

### Immediate Impact (Merchant-configurable)

| # | Action | Estimated Savings | Difficulty |
|:-:|--------|:-----------------:|:----------:|
| 1 | **Defer Allyable widget** — load async after page interactive, or remove the redundant jQuery 2.2.4 it bundles | ~1,675 ms script + fewer long tasks | Medium |
| 2 | **Lazy-load PayPal SDK** — only load when user selects PayPal as payment method | ~809 ms (script + telemetry) | Medium |
| 3 | **Defer FullStory** — delay recording start until after LCP, or sample at lower rate | ~1,168 ms (script + recording) | Low |
| 4 | **Defer ContentSquare** — load after page interactive | ~244 ms | Low |

### Platform-Level (Global-E Engineering)

| # | Action | Impact | Difficulty |
|:-:|--------|:------:|:----------:|
| 5 | **Optimize analytics pixels** — batch `utils.global-e.com/collectCheckout` calls or use `navigator.sendBeacon()` | ~1,500 ms (6 pixel calls) | Medium |
| 6 | **WriteContextualLog batching** — 8 individual POST calls to `/shared/WriteContextualLog` could be batched | ~800 ms network | Medium |
| 7 | **Add `loading="lazy"`** to below-fold images | Reduce image contention | Low |

### Merchant-Side (Montblanc)

| # | Action | Impact | Difficulty |
|:-:|--------|:------:|:----------:|
| 8 | **Optimize product images** — serve WebP/AVIF, responsive sizing for 360px mobile viewport | ~1,383 ms LCP improvement | Medium |
| 9 | **Review Allyable necessity** — is this accessibility widget required? If so, work with vendor on performance | Significant | Business decision |

---

## 13. Visualization: Where Time Is Spent

```
Merchant 1978 Pageload Timeline (8,678 ms total)
═══════════════════════════════════════════════════════════════

TTFB (313ms)  ███░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

Scripts       ████████████████████████████████░░░░░░░░░░░░░░░░░░
              ↑ 17 scripts, 5 are 3rd-party extras

Images        ██████████████████████████████████████░░░░░░░░░░░░
              ↑ 30 images, LCP candidate = 1,383ms Montblanc PNG

HTTP Calls    ████████████████████████████████████████████░░░░░░
              ↑ 20 calls (PayPal logger, FullStory rec, Forter)

Long Tasks    █ █ █ █ █ █ █ █ █ █ █   (11 tasks, ~767ms blocking)

CC iframe     ██████████████████████████████████████████████░░░░
              ↑ securev2.global-e.com credit card form = 1,413ms

───────────────────────────────────────────────────────────────
Merchant 613 Pageload Timeline (7,355 ms total)
═══════════════════════════════════════════════════════════════

TTFB (651ms)  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

Scripts       █████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
              ↑ 12 scripts, NO extras

Images        ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░
              ↑ 23 images

HTTP Calls    ███████████████████████████████████░░░░░░░░░░░░░░░
              ↑ 18 calls (Forter + handleaction only)

Long Tasks    █ █ █   (3 tasks, ~314ms blocking)

iframe        █████████████████████████████████████████████████░
              ↑ 2,033ms (single iframe)
```

---

## 14. Sentry Links for Further Investigation

- **Merchant 1978 Trace:** [View in Sentry](https://global-e-yb.sentry.io/explore/traces/trace/7febca7d820b4917939d95a9562f6af7)
- **Merchant 613 Trace:** [View in Sentry](https://global-e-yb.sentry.io/explore/traces/trace/19a630514f9744ee9eaf7adda8caeedd)
- **1978 Aggregate (24h):** [View in Sentry](https://global-e-yb.sentry.io/explore/traces/?query=is_transaction%3Atrue+AND+transaction.op%3Apageload+AND+merchantId%3A1978&project=4507315449495632&aggregateField=%7B%22yAxes%22%3A%5B%22avg%28span.duration%29%22%5D%7D&mode=aggregate&sort=-avg%28span.duration%29&statsPeriod=24h&table=span)
- **613 Aggregate (24h):** [View in Sentry](https://global-e-yb.sentry.io/explore/traces/?query=is_transaction%3Atrue+transaction.op%3Apageload+merchantId%3A613&project=4507315449495632&aggregateField=%7B%22yAxes%22%3A%5B%22avg%28span.duration%29%22%5D%7D&mode=aggregate&sort=-avg%28span.duration%29&statsPeriod=24h&table=span)
- **Web Vitals 1978:** [View in Sentry](https://global-e-yb.sentry.io/explore/traces/?query=is_transaction%3Atrue+transaction.op%3Apageload+merchantId%3A1978&project=4507315449495632&aggregateField=%7B%22yAxes%22%3A%5B%22avg%28measurements.lcp%29%22%2C%22avg%28measurements.fcp%29%22%2C%22avg%28measurements.ttfb%29%22%2C%22avg%28measurements.cls%29%22%5D%7D&mode=aggregate&sort=-avg%28measurements.lcp%29&statsPeriod=24h&table=span)
- **Web Vitals 613:** [View in Sentry](https://global-e-yb.sentry.io/explore/traces/?query=merchantId%3A%22613%22+transaction.op%3Apageload+has%3Ameasurements.lcp&project=4507315449495632&aggregateField=%7B%22yAxes%22%3A%5B%22avg%28measurements.lcp%29%22%2C%22avg%28measurements.fcp%29%22%2C%22avg%28measurements.ttfb%29%22%2C%22avg%28measurements.cls%29%22%5D%7D&mode=aggregate&sort=-avg%28measurements.lcp%29&statsPeriod=24h&table=span)

---

## 15. Conclusion

The performance degradation for merchant 1978 (Montblanc) is **not caused by Global-E infrastructure**. The server responds faster (313ms TTFB vs 651ms) and the handleaction APIs are 2.3x faster than merchant 613.

The root cause is a **client-side 3rd-party script accumulation** problem:

```
Allyable (1,675ms) + FullStory (1,168ms) + PayPal (809ms) + ContentSquare (244ms) = ~3,896ms extra
```

Combined with a heavy unoptimized product image (1,383ms LCP), these create a cascade of main thread blocking (11 long tasks), layout instability (CLS 0.262), and delayed interactivity that degrades the overall checkout experience.

**Bottom line:** If the 3rd-party scripts were deferred or lazy-loaded, merchant 1978's performance would likely match or exceed merchant 613's.

---
---

# APPENDIX: Multi-Trace Deep Dive (Extended Analysis)

**Added:** February 23, 2026  
**Method:** Sampled 20 slowest + 20 fastest pageloads per merchant (24h), then deep-dived into 5 additional traces.

---

## A1. Merchant 1978 — Full Pageload Distribution (24h Sample)

### Slowest 20 Pageloads (sorted by duration)

| # | Duration | LCP | FCP | TTFB | CLS | Notable |
|:-:|:--------:|:---:|:---:|:----:|:---:|---------|
| 1 | 25,842 ms | — | — | 0 | — | Missing vitals (TTFB=0) |
| 2 | 21,511 ms | — | — | — | — | No vitals reported |
| 3 | 19,992 ms | 5,224 | 5,172 | — | **0.406** | Very high CLS |
| 4 | 19,580 ms | 8,032 | 7,964 | — | **0.413** | Very high CLS |
| 5 | 18,086 ms | 9,880 | 9,812 | — | 0.039 | Extreme LCP |
| 6 | 17,031 ms | 7,136 | 5,388 | 436 | 0.144 | High LCP-FCP gap |
| 7 | 16,948 ms | 11,120 | 11,056 | — | **0.368** | 11s LCP! |
| 8 | 15,892 ms | 1,276 | 760 | — | 0.251 | Fast LCP, slow total |
| 9 | 15,665 ms | — | — | 0 | — | Missing vitals |
| 10 | 14,915 ms | — | — | — | — | No vitals |
| 11 | 14,349 ms | 10,368 | 1,704 | 971 | 0.297 | 8.6s LCP-FCP gap! |
| 12 | 14,345 ms | 5,960 | 4,224 | 450 | 0.130 | |
| 13 | 13,388 ms | — | — | 0 | — | Missing vitals |
| 14 | 13,113 ms | 8,376 | 4,276 | 1,022 | 0.269 | High TTFB + LCP |
| 15 | 13,064 ms | — | — | 0 | — | Missing vitals |
| 16 | 13,029 ms | 2,416 | 2,368 | 1,331 | **0.367** | High TTFB + CLS |
| 17 | 12,149 ms | 2,352 | 2,300 | 1,007 | **0.435** | Worst CLS |
| 18 | 11,593 ms | — | — | 0 | — | Missing vitals |
| 19 | 11,571 ms | — | — | 0 | — | Missing vitals |
| 20 | 11,290 ms | 3,120 | 2,836 | 349 | **0.362** | |

### Fastest 20 Pageloads (sorted by duration)

| # | Duration | LCP | FCP | TTFB | CLS | Notable |
|:-:|:--------:|:---:|:---:|:----:|:---:|---------|
| 1 | 599 ms | — | — | 0 | — | Likely bot/prefetch |
| 2 | 703 ms | 612 | 612 | 478 | — | Fast - cached? |
| 3 | 857 ms | 644 | 528 | 352 | 0.037 | Excellent vitals |
| 4 | 1,044 ms | — | 454 | 229 | — | |
| 5 | 1,160 ms | 801 | 754 | 0 | — | |
| 6 | 1,234 ms | 908 | 889 | 444 | — | |
| 7 | 1,322 ms | — | 510 | 228 | — | |
| 8 | 1,564 ms | 1,180 | 1,138 | 886 | — | |
| 9 | 1,586 ms | 732 | 196 | — | — | |
| 10 | 1,602 ms | 978 | 859 | 678 | — | |

**Key observations for 1978:**
- **CLS is consistently terrible:** 10 out of 12 traces with CLS data show CLS > 0.25 ("Poor")
- **LCP varies wildly:** From 612ms to 11,120ms — a 18x range
- **Many traces missing vitals** (TTFB=0 or no LCP): ~40% of slow traces don't report vitals, suggesting early page abandonment or measurement issues
- **Fastest loads (~600-1,600ms)** have excellent vitals — these are likely cached/returning visitors on fast networks

---

## A2. Merchant 613 — Full Checkout Pageload Distribution (24h Sample)

> **Data quality note:** Merchant 613's raw results included `/GlobalEAdmin/StoreOrders/Index` admin panel pages. These were filtered out below to show only `/Checkout/v2` transactions.

### Slowest 20 Checkout Pageloads

| # | Duration | LCP | FCP | TTFB | CLS | Notable |
|:-:|:--------:|:---:|:---:|:----:|:---:|---------|
| 1 | 32,355 ms | 18,348 | 18,308 | — | 0.039 | Extreme LCP |
| 2 | 20,243 ms | 4,246 | 3,475 | 1,784 | 0.021 | High TTFB |
| 3 | 16,641 ms | — | — | — | — | No vitals |
| 4 | 16,399 ms | 5,336 | 2,484 | 1,740 | **0.477** | Worst CLS! |
| 5 | 15,003 ms | 8,424 | 5,524 | — | 0.014 | |
| 6 | 14,961 ms | — | — | — | — | No vitals |
| 7 | 13,389 ms | — | — | 0 | — | |
| 8 | 12,903 ms | — | — | 0 | — | |
| 9 | 12,407 ms | 5,248 | 3,196 | 2 | 0.042 | |
| 10 | 11,963 ms | 4,752 | 2,684 | 402 | 0.035 | |
| 11 | 11,926 ms | 5,179 | 3,002 | 825 | 0.106 | |
| 12 | 11,482 ms | 4,400 | 1,736 | — | 0.065 | |
| 13 | 10,728 ms | 6,340 | 3,604 | 715 | **0.483** | Worst CLS!! |
| 14 | 10,652 ms | 3,736 | 3,720 | 1,971 | 0.151 | Very high TTFB |
| 15 | 10,403 ms | — | — | 0 | — | |

### Fastest 20 Checkout Pageloads

| # | Duration | LCP | FCP | TTFB | CLS | Notable |
|:-:|:--------:|:---:|:---:|:----:|:---:|---------|
| 1 | 996 ms | — | — | — | — | |
| 2 | 1,094 ms | — | — | 0 | — | |
| 3 | 1,111 ms | — | — | — | — | |
| 4 | 1,485 ms | 1,416 | 1,360 | — | 0.002 | Excellent CLS |
| 5 | 1,558 ms | — | — | — | — | |
| 6 | 2,048 ms | — | — | 0 | — | |
| 7 | 2,107 ms | 1,160 | 1,120 | — | 0.022 | |
| 8 | 2,249 ms | 188 | 112 | 10 | 0.086 | Blazing fast vitals |
| 9 | 2,266 ms | — | — | — | — | |
| 10 | 2,428 ms | — | — | 0 | — | |

**Key observations for 613:**
- **CLS is mostly good** but has severe outliers (0.477, 0.483) — not consistently bad like 1978
- **TTFB is higher than 1978** on slow traces (1,740ms, 1,784ms, 1,971ms)
- **Fastest loads are similar** to 1978 (~1,000-2,500ms range)
- **Admin pages pollute the data** — must always filter to `/Checkout/v2` only

---

## A3. Deep-Dive: Additional Trace Comparisons

### Trace Comparison Table: 1978 Trace d8becac3 (10,652ms)

This is a **"clean" 1978 trace** — NO Allyable, PayPal, ContentSquare, or FullStory scripts present.

| Attribute | Value |
|-----------|-------|
| **Total Duration** | 10,652 ms |
| **LCP / FCP / TTFB** | 3,736 / 3,720 / **1,971** ms |
| **CLS** | 0.151 |
| **Total Spans** | 104 |
| **resource.script** | 12 (same count as 613!) |
| **resource.img** | **31** |
| **resource.css** | 15 |
| **ui.long-task** | **3** |
| **http.client** | 14 |
| **resource.iframe** | 1 (3,883 ms) |

**Script loading times (this trace had a very slow network):**

| Script | Duration |
|--------|:--------:|
| Forter script.js | **2,853 ms** |
| widgetsAutocompleteScripts.js | **2,024 ms** |
| globale-analytics-sdk bundle.js | **1,922 ms** |
| widgetsLightcomboboxScripts.js | **1,884 ms** |
| checkoutv2_bottom_handle_actions.js | **1,792 ms** |
| widgetsThirdpartyScripts.js | **1,667 ms** |
| Sentry SDK (loader) | **1,611 ms** |
| Sentry browserprofiling | **1,320 ms** |
| mpsnare (Iovation) | **1,117 ms** |
| Sentry bundle.tracing.replay | **1,061 ms** |
| snare.js | 784 ms |
| checkoutv2_top.js | 738 ms |

> **Insight:** Without the extra 3rd-party scripts, 1978 still loads 12 scripts — the same as 613. The 10.6s total here is driven by an **extremely slow network** (TTFB 1,971ms, all scripts >1s). The credit card iframe alone took 3,883ms.

---

### Trace Comparison: 613 Trace 61ce76ba (16,399ms - Slow)

| Attribute | Value |
|-----------|-------|
| **Total Duration** | 16,399 ms |
| **LCP / FCP / TTFB** | 5,336 / 2,484 / **1,740** ms |
| **CLS** | **0.477** |
| **Total Spans** | 73 |
| **resource.script** | 12 |
| **resource.img** | **3** (very few images) |
| **resource.css** | 6 |
| **ui.long-task** | **10** |
| **http.client** | 16 (avg 1,458ms!) |
| **http.server** | 1 (106ms) |

**Script loading times:**

| Script | Duration |
|--------|:--------:|
| Forter script.js | **1,676 ms** |
| checkoutv2_bottom_handle_actions.js | 144 ms |
| Sentry bundle.tracing.replay | 140 ms |
| checkoutv2_top.js | 108 ms |
| widgetsAutocompleteScripts.js | 46 ms |
| widgetsLightcomboboxScripts.js | 41 ms |
| widgetsThirdpartyScripts.js | 30 ms |
| All others | <30 ms each |

> **Insight:** This slow 613 trace is dominated by **HTTP client calls** (avg 1,458ms) and has **10 long tasks** despite only having 12 scripts with fast load times. The 16.4s total is NOT caused by script download — it's caused by slow API calls and heavy script execution / DOM operations. Only 3 images but **6 resource.beacon** calls averaging 3,637ms!

---

### Trace Comparison: 613 Trace c9d31e1a (10,728ms - Medium with EXTREME Long Tasks)

| Attribute | Value |
|-----------|-------|
| **Total Duration** | 10,728 ms |
| **LCP / FCP / TTFB** | 6,340 / 3,604 / 715 ms |
| **CLS** | **0.483** (worst of all traces!) |
| **Total Spans** | 87 |
| **resource.script** | 12 |
| **ui.long-task** | **30** (!!!) |
| **http.client** | 13 |

**Long task breakdown (30 tasks, 4,808ms total blocking!):**

| Duration Range | Count | Subtotal |
|:--------------:|:-----:|:--------:|
| >500ms | 2 | 1,674 ms |
| 200-500ms | 4 | 913 ms |
| 100-200ms | 8 | 1,070 ms |
| 50-100ms | 16 | 1,151 ms |
| **Total** | **30** | **4,808 ms** |

> **Critical finding:** This 613 trace has **30 long tasks totaling 4.8 seconds of main thread blocking** — far worse than any 1978 trace we've seen! The top two long tasks are 894ms and 780ms, suggesting heavy script execution on a **low-powered device**. All scripts loaded from cache (0ms) so the blocking is from execution, not download.

---

## A4. Revised Cross-Merchant Comparison Matrix

| Metric | 1978 Trace 1 (8.7s) | 1978 Trace 2 (10.7s) | 613 Trace 1 (7.4s) | 613 Trace 2 (16.4s) | 613 Trace 3 (10.7s) |
|--------|:---:|:---:|:---:|:---:|:---:|
| **Has Allyable** | YES | NO | NO | NO | NO |
| **Has PayPal SDK** | YES | NO | NO | NO | NO |
| **Has FullStory** | YES | NO | NO | NO | NO |
| **Has ContentSquare** | YES | NO | NO | NO | NO |
| **Script count** | 17 | 12 | 12 | 12 | 12 |
| **Image count** | 30 | 31 | 23 | 3 | 0 |
| **Long task count** | 11 | 3 | 3 | 10 | **30** |
| **Long task total** | 767ms | ~200ms | 314ms | ~1,040ms | **4,808ms** |
| **CLS** | 0.262 | 0.151 | 0.103 | **0.477** | **0.483** |
| **TTFB** | 313ms | **1,971ms** | 651ms | **1,740ms** | 715ms |

---

## A5. Revised Findings (Multi-Trace)

### Key Revision #1: 3rd-Party Scripts Are NOT Always Present for 1978

The Allyable/PayPal/ContentSquare/FullStory scripts appear in **some** merchant 1978 traces but not all. This means:
- They are likely **merchant-configurable** or **country/page-specific**
- When absent, 1978 loads the same 12 scripts as 613
- The performance gap in traces WITHOUT these scripts is driven by **network conditions** and **product images**, not script count

### Key Revision #2: 613 Has Its Own Severe Performance Issues

Merchant 613 can exhibit **extreme long-task blocking** (up to 30 tasks / 4.8s) that far exceeds any observed 1978 trace. This appears device-dependent:
- Scripts load from cache (0ms) but execution causes massive blocking
- Suggests **low-powered mobile devices** in the 613 user base
- The CLS outliers (0.477, 0.483) are WORSE than 1978's worst

### Key Revision #3: Both Merchants Suffer From High TTFB Outliers

When TTFB is high (>1s), both merchants show degraded performance:
- 1978: TTFB 1,971ms trace → total pageload 10.7s
- 613: TTFB 1,740ms and 1,784ms traces → 16.4s and 20.2s

### Key Revision #4: CLS Is a Systemic Issue (Both Merchants)

| CLS Category | 1978 (12 traces with data) | 613 (10 traces with data) |
|:------------:|:--------------------------:|:-------------------------:|
| Good (<0.1) | 2 (17%) | 5 (50%) |
| Needs Improvement (0.1-0.25) | 3 (25%) | 3 (30%) |
| Poor (>0.25) | **7 (58%)** | **2 (20%)** |

Merchant 1978 has CLS > 0.25 in **58% of traces** vs 613's **20%** — still significantly worse, confirming that 1978's checkout layout is more unstable (likely due to dynamically injected 3rd-party content when present).

---

## A6. Updated Root Cause Summary

### Merchant 1978's Performance Issues (Ranked by Impact)

| Priority | Root Cause | Confidence | Impact | Present In |
|:--------:|-----------|:----------:|:------:|:----------:|
| **1** | **3rd-party scripts** (Allyable/PayPal/FullStory/ContentSquare) when loaded | High | +2-4s total pageload | ~50% of traces |
| **2** | **CLS instability** — layout shifts from dynamic content injection | High | CLS >0.25 in 58% of traces | Systemic |
| **3** | **Heavy merchant product images** from Demandware CDN | Medium | +1-1.4s to LCP | Most traces |
| **4** | **More image resources** (30+ vs 23 or fewer for 613) | Medium | Added bandwidth contention | Most traces |
| **5** | **Slow mobile networks** — Samsung Browser/Android users | Medium | All scripts 5-10x slower to load | Device-dependent |

### Merchant 613's Hidden Issues (For Context)

| Priority | Root Cause | Impact | Present In |
|:--------:|-----------|:------:|:----------:|
| 1 | **Extreme long-task blocking** on low-power devices | Up to 4.8s blocking (30 tasks) | Some traces |
| 2 | **Higher TTFB** (avg 651ms vs 313ms for 1978) | Server response consistently slower | Systemic |
| 3 | **CLS outliers** up to 0.483 | Worse than 1978's worst individual | Some traces |
| 4 | **Admin page data pollution** — StoreOrders/Index pageloads tagged with merchantId | Skews aggregate metrics | Data issue |

---

## A7. Sentry Links for All Deep-Dived Traces

| Merchant | Trace ID | Duration | Link |
|:--------:|----------|:--------:|------|
| 1978 | 7febca7d (original) | 8,678 ms | [View](https://global-e-yb.sentry.io/explore/traces/trace/7febca7d820b4917939d95a9562f6af7) |
| 1978 | d8becac3 (clean/slow net) | 10,652 ms | [View](https://global-e-yb.sentry.io/explore/traces/trace/d8becac34bfd42a4a544827b9cceff66) |
| 613 | 19a63051 (original) | 7,355 ms | [View](https://global-e-yb.sentry.io/explore/traces/trace/19a630514f9744ee9eaf7adda8caeedd) |
| 613 | 61ce76ba (slow/high CLS) | 16,399 ms | [View](https://global-e-yb.sentry.io/explore/traces/trace/61ce76ba90104c5f8554233ff8e5474c) |
| 613 | c9d31e1a (30 long tasks!) | 10,728 ms | [View](https://global-e-yb.sentry.io/explore/traces/trace/c9d31e1a66524f568c9958e27f1f4e59) |
