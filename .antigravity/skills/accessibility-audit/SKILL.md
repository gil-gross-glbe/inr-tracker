---
name: accessibility-audit
description: WCAG 2.2 AA compliance patterns for Core checkout. Covers progressive enhancement, scoped CSS, feature flag isolation, dual-view strategy, ARIA patterns, keyboard navigation, and merchant skin safety. Use when implementing accessibility features, reviewing a11y code, or auditing WCAG compliance.
version: 1.0.0
last_updated: 2026-02-25
---

# Accessibility Implementation Patterns

## When to Use

- Implementing WCAG 2.2 AA features in Core checkout
- Adding ARIA attributes, keyboard navigation, or focus management
- Creating new feature-flagged CSS/views in the monolith
- Reviewing accessibility code changes
- Pre-deployment risk assessment for a11y features

## Core Philosophy

- **A11y as Overlay**: Opt-in enhancements, NOT replacements
- **Backward Compatibility**: Legacy functionality must remain unchanged
- **Graceful Degradation**: Works without a11y features enabled
- **Non-Breaking**: Never alter existing merchant experiences

## Step-by-Step: Adding a New A11y Feature

### Step 1: Create Feature Flag

Use dual feature flag pattern for safety:

```javascript
if (self.initData.PaymentMethodsV2Accessibility &&
    self.initData.isCheckoutPaymentMethodSectionV2) {
    // A11y enhancement code
}
```

Source: `Web/Views/CheckoutV2/UXSettings.cshtml`

### Step 2: Create Scoped CSS File

**NEVER modify global CSS files.** Create feature-specific CSS:

```
Web/Content/checkout/Sprites/
├── paymentMethods.css          # Legacy (NEVER modify)
└── paymentMethodsA11y.css      # A11y-specific (feature-flagged)
```

Load only when enabled:
```html
<link rel="stylesheet" href="@Url.CDNContent("/Content/checkout/Sprites/paymentMethodsA11y.css", Model.CheckoutData.MerchantID)" />
```

Scope ALL styles under feature class:
```css
.payment-a11y-enabled .pm_box { display: flex; align-items: center; }
.payment-a11y-enabled .pm_box input[type="radio"] {
    order: 0 !important;
    margin-right: var(--a11y-radio-spacing) !important;
}
```

Use CSS custom properties:
```css
:root {
    --a11y-primary-color: #D65F00;
    --a11y-focus-color: #005fcc;
    --a11y-radio-spacing: 10px;
    --a11y-border-radius: 4px;
}
```

### Step 3: Create Dual View (if applicable)

Legacy: `PaymentMethodsV2.cshtml` (unchanged)
A11y: `PaymentMethodsV2A11y.cshtml` (enhanced)

```csharp
if (isPaymentMethodsV2AccessibilityEnabled)
    return PartialView("PaymentMethodsV2A11y", model);
else
    return PartialView("PaymentMethodsV2", model);
```

A11y view enhancements: `<fieldset>` + `<legend>`, real `<input type="radio">`, proper ARIA, `.payment-a11y-enabled` scoping class.

### Step 4: Implement JavaScript Patterns

**State sync after validation (CRITICAL):** UI changes ONLY after backend validation completes.

```javascript
$(document).on('click', 'input[type="radio"][name="paymentMethod"]', function(e) {
    if (self.initData.PaymentMethodsV2Accessibility) {
        e.preventDefault();
        e.stopPropagation();
        PMClicked(this); // Route through validation
    }
});
```

**ARIA accordion pattern:**
```javascript
$accordion.attr('role', 'tablist');
$header.attr('role', 'tab')
    .attr('aria-controls', 'pmAccordion-panel-' + i)
    .attr('tabindex', isActive ? '0' : '-1')
    .attr('aria-selected', isActive);
```

**Keyboard navigation:**
```javascript
$(document).on('keydown', '.pm_box[role="tab"]', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        $(this).click();
    }
});
```

### Step 5: Test Both Code Paths

- Feature flag ON: Full a11y functionality
- Feature flag OFF: Legacy behavior unchanged

### Step 6: Merchant Skin Risk Assessment

Run SQL to identify at-risk merchants:
```sql
SELECT m.merchantname, mas.*
FROM merchantappsettings mas
INNER JOIN merchants m ON mas.merchantid = m.merchantid
INNER JOIN merchantappsettings mas2 ON mas2.merchantid = m.merchantid
WHERE mas.appsettingname='CustomCheckoutStyle'
  AND (mas.appsettingvalue LIKE '%.pm_box::before%'
    OR mas.appsettingvalue LIKE '%.pm_box_accordion::before%')
  AND mas2.appsettingname = 'PaymentMethodNewLayoutDisplay'
  AND mas2.appsettingvalue = 'true'
```

**High-risk merchants:** Victoria's Secret, Disney (860, 1022), Versace, Clarks, Harrods, any merchant with `.pm_box::before` custom CSS.

## WCAG 2.2 AA Checklist

- [ ] Color contrast ≥ 4.5:1 for normal text
- [ ] All interactive elements keyboard accessible
- [ ] Proper ARIA roles, states, and properties
- [ ] Focus visible on all interactive elements (WCAG 2.4.7)
- [ ] No content flashing (WCAG 2.3.1)
- [ ] Form errors clearly identified and described
- [ ] Feature flag isolation — zero leakage when disabled

## Common Pitfalls

| Pitfall | Solution |
|---------|----------|
| Global CSS changes | Scoped CSS files loaded conditionally |
| Radio button state sync | `preventDefault()` + async validation pattern |
| Feature flag leakage | Wrap ALL a11y code in flag checks |
| A11y as replacement | Progressive enhancement — additive only |
| Merchant skin collision | SQL risk assessment + canary deployment |

## Related Tickets

CORE-139714, CORE-144120, PLD-10640
