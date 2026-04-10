---
name: shopify-extension-creation
description: Guide for creating and modifying Shopify UI extensions and Functions in the Apps NX monorepo. Covers extension targets, shared utilities, detection patterns, metafield integration, and deployment. Use when working on Shopify C1 extensions, payment customization, or PUDO.
version: 1.0.0
last_updated: 2026-02-25
---

# Shopify UI Extensions & Functions

## When to Use

- Creating a new Shopify UI extension or Function
- Modifying existing extensions in `apps/shopify-c1/src/app/extensions/`
- Working on payment customization, shipping address fields, or checkout blocks
- Integrating with CheckoutService from a Shopify extension
- Managing metafields or checkout attributes

## Current Extensions (19 total)

**UI Extensions (14):** `alternative-payment-icons`, `alternative-payment-methods`, `borderfree-account`, `borderfree-account-register`, `borderfree-promotions`, `duties-and-taxes`, `marketing-offers-extension`, `order-additional-information`, `order-instructions`, `payment-additional-fields`, `pudo-collection-points`, `shipping-address-additional-fields`, `shipping-address-validation`, `terms-and-conditions`

**Shopify Functions (5):** `payment-customization`, `must-fulfill-from-same-location` (v1, v2, v3, v4)

## Step-by-Step: Creating a New Extension

### Step 1: Scaffold

```bash
cd apps/shopify-c1/src/app
npx shopify app generate extension
```

Select extension type (checkout UI, Function, etc.) and name it.

### Step 2: Configure Extension Target

In `shopify.extension.toml`:
```toml
[[extensions]]
name = "my-extension"
type = "ui_extension"

[[extensions.targeting]]
module = "./src/Checkout.tsx"
target = "purchase.checkout.block.render"
```

**Common targets:**
- `purchase.checkout.shipping-option-item.render-after` — After each shipping option
- `purchase.checkout.payment-method-option-item.render-after` — After payment options
- `purchase.checkout.block.render` — Generic content block

### Step 3: Use Shared Utilities

Import from `extensions/shared/`:

```typescript
import { useShopifyStorage } from '../shared/useShopifyStorage';
import { useGetMetafieldByKey } from '../shared/useGetMetafieldByKey';
import { useUpdateMetafield } from '../shared/useUpdateMetafield';
import { useSentry } from '../shared/useSentry';
import { useLogger } from '../shared/useLogger/useLogger';
```

**Checkout data hooks** (`shared/shopify-checkout-data/`):
- Session token management
- CheckoutService API integration
- Merchant/country/culture context

### Step 4: Integrate with CheckoutService

Extensions fetch data from CheckoutService, NOT directly from Core monolith.

```typescript
const response = await fetch(
  `${checkoutServiceUrl}/Shopify/collection-points/${merchantId}/${countryCode}/${cultureCode}`,
  { headers: { Authorization: `Bearer ${sessionToken}` } }
);
```

### Step 5: Conditional Rendering Patterns

```typescript
// Render only when specific shipping option is selected
const shouldShow = isCollectionPointShippingOption(target) && isTargetSelected;

// Service code detection pattern (e.g., PUDO)
const isCollectionPoint = (option: ShippingOption) =>
  option?.code.indexOf('COLLECTIONPOINT') !== -1;
```

### Step 6: Deploy

```bash
# To specific environment
npx shopify app deploy --config=shopify.app.QA.toml

# Environment configs at: apps/shopify-c1/src/app/shopify.app.{ENV}.toml
# Environments: PROD, QA, QA-HF, STG, INT, LT, DR
```

## Best Practices

1. **Conditional rendering**: Use `isTargetSelected` for option-specific content
2. **Service code detection**: Prefix-based identification for method types
3. **Graceful degradation**: Handle API failures silently, never break checkout
4. **Native feel**: Match Shopify's design system
5. **Performance**: Lazy load content, minimize re-renders
6. **State management**: Zustand for extension state
7. **Feature flags**: Use `FT_` prefixed flags in CheckoutService to gate features
8. **Shared components**: Reuse from `libs/ui/` via `@global-e/ui/*`

## Data Flow

```
Shopify Checkout → UI Extension → CheckoutService API → Core Monolith (/Shopify controllers)
```

Selection storage: Shopify metafields or checkout attributes.
Webhook API version: `2026-01` (configured in TOML files).
