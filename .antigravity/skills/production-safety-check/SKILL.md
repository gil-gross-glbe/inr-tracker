---
name: production-safety-check
description: Pre-deployment safety verification for Core checkout releases. Covers CSS/skin collision prevention, feature flag isolation, merchant risk assessment, canary deployment, emergency rollback, and cross-team coordination. Use before any Core release, when modifying CSS/HTML, or after production incidents.
version: 1.0.0
last_updated: 2026-02-25
---

# Production Safety Check

## When to Use

- Before any Core checkout release
- When modifying CSS, HTML structure, or class names in the monolith
- After a production incident (update this skill with lessons)
- Reviewing PRs that touch checkout views or styles
- Planning canary deployment strategy

## Historical Incidents (Learn From These)

| Incident | Root Cause | Lesson |
|----------|-----------|--------|
| CORE-139714/PLD-10640 | A11y CSS broke radio buttons on custom-skin merchants | Always scope CSS under feature class |
| PLD-11199 (Zadig & Voltaire) | `div` → `article` HTML change broke layout | Custom skins depend on HTML structure |
| PLD-11215 (Disney UK) | Mobile zoom issue with viewport meta | Test mobile-specific features separately |
| CORE-152303 (Versace) | MUI library update broke auto-generated classes | Library updates can break class dependencies |
| CORE-152824/CORE-152828 | Mobile responsiveness issues | Always test mobile viewports |

## Pre-Release Checklist (T-72 hours)

### 1. CSS/Skin Collision Assessment

Run this SQL to identify at-risk merchants:
```sql
SELECT m.merchantname, mas.*
FROM merchantappsettings mas
INNER JOIN merchants m ON mas.merchantid = m.merchantid
INNER JOIN merchantappsettings mas2 ON mas2.merchantid = m.merchantid
WHERE mas.appsettingname='CustomCheckoutStyle'
  AND (mas.appsettingvalue LIKE '%[CSS_SELECTOR_YOU_CHANGED]%')
  AND mas2.appsettingname = 'PaymentMethodNewLayoutDisplay'
  AND mas2.appsettingvalue = 'true'
```

Replace `[CSS_SELECTOR_YOU_CHANGED]` with actual selectors modified in the release.

### 2. Feature Flag Verification

- [ ] All new features gated behind feature flags
- [ ] Feature flag OFF → zero behavior change (test this!)
- [ ] No CSS loaded when feature disabled
- [ ] No JavaScript executes when feature disabled
- [ ] Scoping class present on container element

### 3. CSS Safety Rules

```css
/* ❌ DANGEROUS: Global changes affect all merchants */
.pm_box_accordion { /* changes */ }

/* ✅ SAFE: Scoped under feature flag class */
.payment-a11y-enabled .pm_box_accordion { /* changes */ }
```

- [ ] No global CSS file modifications
- [ ] New CSS in feature-specific file
- [ ] CSS only loaded when feature enabled
- [ ] All styles scoped under feature-specific class

### 4. Cross-Team Coordination Meeting

**Attendance**: 2 Core checkout teams + FE team + Release Manager (30 min)

**Deliverables:**
- List of affected merchants with risk levels
- FE team canary merchant list with justification
- Expected appearance screenshots per sensitive merchant
- Go/No-Go decision

## Critical Merchant Matrix

| Environment | High-Priority | Risk Factors |
|-------------|--------------|--------------|
| **STG** | Harrods, Disney EMEA (860), Disney UK (1022) | A11y sensitive, premium brands |
| **INT** | Prusa, Victoria's Secret, IZIPIZI | High volume, IP restrictions |
| **PROD** | All above + Versace, Clarks, Gentle Monster, Onitsuka Tiger, Logitech | Full merchant spectrum |

## Deployment Day Process

### Canary Deployment

1. Deploy with feature flags **OFF**
2. Enable for canary merchants only (5% traffic)
3. Monitor 30 minutes with screenshot comparison
4. Gradual rollout to all merchants

### Real-Time Monitoring

- Screenshot comparison vs FE team references
- Console error monitoring (target: <2% increase)
- Mobile responsiveness verification
- Customer journey completion rates

## Emergency Response

### Escalation Triggers

**CRITICAL (15 min):** Canary merchant visual regression, multiple merchant styling issues, checkout functionality broken, >5% error rate increase

**INVESTIGATE (1 hour):** Single merchant styling issue, screenshot mismatch, mobile-specific problems

### Response Actions

1. **Immediate**: Disable problematic feature flag
2. **Document**: Capture comparison screenshots
3. **Notify**: FE team via `#core-releases`
4. **Assess**: Rollback vs hotfix evaluation
5. **Prevent**: Update this document with new pattern

### Slack Channels

- `#core-releases` — Main coordination
- `#frontend-alerts` — Visual issues
- `#checkout-teams` — Emergency escalation

## Success Metrics

- Zero critical merchant visual regressions
- All screenshots match FE team references
- <2% increase in console errors
- Mobile responsiveness maintained
- No emergency escalations required

## Root Cause Categories (Reference)

1. **Global CSS Changes** → Use scoped CSS files
2. **HTML Structure Changes** → Custom skins depend on DOM elements
3. **Library Updates** → Can break auto-generated class dependencies
4. **Feature Flag Leakage** → Test disabled state explicitly
5. **Cross-Team Communication** → Structured pre-release meetings
