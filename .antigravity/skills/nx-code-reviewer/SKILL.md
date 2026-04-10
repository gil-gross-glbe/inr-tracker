---
name: nx-code-reviewer
description: Reference guide for NX PR reviews. For automated reviews with actual NX command execution (affected projects, lint, tests, circular deps), use the nx-code-reviewer subagent. This skill provides the methodology, checklists, and patterns for manual NX code reviews.
version: 1.0.0
last_updated: 2026-03-08
---

# NX Code Reviewer — globale.checkout.apps

Reference skill for PR reviews in the NX monorepo (React 18, TypeScript 5.7, NX 21).

> **Note:** For **automated PR reviews** that run actual NX commands (`nx show projects --affected`, `nx graph`, `nx lint`, `nx test`), use the **nx-code-reviewer subagent** instead: `"Use the nx-code-reviewer subagent to review this Apps PR"`

## When to Use This Skill

- Manual code review guidance and reference
- Understanding NX-specific patterns and conventions
- Quick lookup for dual-platform component checks
- Reference for import conventions and state management patterns

## Quick Start

```bash
# Get PR diff (compare feature branch to base)
git diff develop...feature/BRANCH-NAME

# Get affected projects/libs
nx show projects --affected --base=develop --head=HEAD

# Get project graph for affected
nx graph --affected
```

## NX-Specific Review Checklist

### 1. Project Structure & Dependencies

**Library Boundaries:**
- [ ] New code in correct lib/app location
- [ ] No circular dependencies between libs
- [ ] Imports use `@global-e/` prefix, not relative paths across libs
- [ ] `project.json` properly configured with targets

**Dependency Validation:**
```bash
# Check for dependency issues
nx lint AFFECTED_PROJECT

# Validate project graph
nx graph --affected
```

### 2. Dual-Platform Component Patterns

All components must work in both contexts:

| Context | Entry Point | State | UI |
|---------|-------------|-------|-----|
| **Classic** | Web component (`@r2wc`) | Zustand + DOM events | MUI via UI Adapter |
| **Shopify** | UI Extension target | Zustand | Shopify UI Ext |

**Review Checklist:**
- [ ] `UIAdapterProvider` wraps component for platform-agnostic UI
- [ ] `useUI()` hook used instead of direct MUI/Shopify imports
- [ ] Hidden inputs (`HiddenFieldOldView`) for Classic form data
- [ ] DOM events bubble for monolith integration

**Anti-Patterns to Catch:**
```typescript
// ❌ Direct MUI import in shared component
import { TextField } from '@mui/material';

// ✅ UI Adapter pattern
import { useUI } from '@global-e/ui-adapter';
const { TextField } = useUI();
```

### 3. State Management (Zustand)

**Store Patterns:**
- [ ] Slice-based stores (e.g., `useAddressFormStore` has 12 slices)
- [ ] Proper TypeScript typing for store state/actions
- [ ] No localStorage/sessionStorage for app state

**MAS Settings Handling:**
```typescript
// ❌ Direct string comparison
if (masSetting === 'true') { }

// ✅ Use selectors
import { selectFormBooleanSetting } from '@global-e/stores/selectors';
const isEnabled = selectFormBooleanSetting('MyFeature');

// ✅ Or conversion helper
import { convertStringToBoolean } from '@global-e/helpers';
const isEnabled = convertStringToBoolean(masSetting);
```

### 4. Web Component → Monolith Integration

**Data Flow TO Core:**
```typescript
// Hidden inputs rendered by React
<HiddenFieldOldView
  name="FieldName"
  value={value}
  onChange={handleChange}
/>
```

**Real-Time Sync:**
```typescript
// DOM event bubbling for jQuery handlers
dispatchEvent(new CustomEvent('change', { bubbles: true }));
```

**Review Checks:**
- [ ] `HiddenFieldOldView` used for form submission data
- [ ] Events bubble (`bubbles: true`) for monolith catching
- [ ] Custom element props properly typed in registration

### 5. Shopify Extensions Review

**Extension Structure:**
```
apps/shopify-c1/src/app/extensions/EXTENSION-NAME/
├── shopify.extension.toml    # Target configuration
├── src/
│   └── Checkout.tsx          # Main component
```

**Review Checklist:**
- [ ] Correct extension target in TOML
- [ ] `useShopifyStorage` for metafield management
- [ ] `useGetMetafieldByKey` / `useUpdateMetafield` for data
- [ ] `useSentry` for error tracking
- [ ] `useLogger` for consistent logging
- [ ] Graceful degradation (never break checkout)

**API Integration:**
```typescript
// ✅ Call CheckoutService, NOT Core directly
const response = await fetch(
  `${checkoutServiceUrl}/Shopify/endpoint`,
  { headers: { Authorization: `Bearer ${sessionToken}` } }
);
```

### 6. Import Conventions

**All libraries use `@global-e/` prefix:**
```typescript
// ✅ Correct
import { useUI } from '@global-e/ui-adapter';
import { TextField } from '@global-e/ui/textField';
import { useAddressFormStore } from '@global-e/address-form-monolith';
import { convertStringToBoolean } from '@global-e/helpers';

// ❌ Incorrect - relative paths across libs
import { something } from '../../../libs/ui/src/lib/something';
```

### 7. Build & Bundle Checks

**Web Components (S3 Deployment):**
- [ ] `vite.config.ts` has correct build target
- [ ] Single file output (`build.rollupOptions.output.manualChunks: undefined`)
- [ ] Proper externals (React as global for Core)

**Shopify Extensions:**
- [ ] TypeScript compilation passes
- [ ] No `console.log` in production code (use `useLogger`)

### 8. Testing Requirements

**Unit Tests:**
- [ ] Jest tests for stores/utilities
- [ ] Component tests with proper mocks
- [ ] UI Adapter mocking for platform isolation

**Integration:**
- [ ] Extension tests use Shopify mock data
- [ ] Web component tests verify DOM events

## NX MCP Integration

When reviewing, use NX MCP tools:

```bash
# Understand workspace context
nx_docs: "NX monorepo dependency graph and affected projects"

# Get project details
nx show project PROJECT_NAME

# Check affected
nx show projects --affected --base=develop --head=HEAD
```

## Repository-Specific Safety Patterns

### Feature Flags
- All new features must be gated
- Use `FT_` prefixed flags for CheckoutService integration
- Test both enabled and disabled paths

### CSS/Skin Safety (via Web Components)
- Scoped styles only (CSS-in-JS or CSS modules)
- No global CSS that could affect Core monolith
- Feature-specific class names

### Backward Compatibility
- Web components must work with existing Core checkout
- Extensions must handle missing metafields gracefully
- API changes must be backward compatible

## Review Output Template

```markdown
# NX PR Review: [FEATURE_NAME] - [JIRA_ID]

## 🎯 Executive Summary
[Brief overview of changes and overall assessment]

## 📊 Affected Projects/Libs
```
nx show projects --affected --base=develop --head=HEAD
```

## ✅ NX Architecture Assessment

### Project Structure
- [ ] Code in correct lib/app location
- [ ] No circular dependencies
- [ ] Proper `@global-e/` imports

### Dual-Platform Compatibility
- [ ] UI Adapter pattern used
- [ ] Classic path verified
- [ ] Shopify path verified

### State Management
- [ ] Zustand patterns correct
- [ ] MAS settings handled properly
- [ ] No localStorage misuse

## ⚠️ Critical Issues

### 🚨 High Priority
- [Breaking changes, security, missing feature flags]

### ⚠️ Medium Priority
- [Code quality, test coverage, type safety]

## 🔧 Code Quality Issues

### TypeScript
- [Specific type issues]

### React Patterns
- [Component structure feedback]

### NX Patterns
- [Project structure feedback]

## 🧪 Testing Recommendations
- [Unit test requirements]
- [Integration test scenarios]

## 🚀 Deployment Readiness
- [ ] Build passes
- [ ] Tests pass
- [ ] Web component bundle valid
- [ ] Extension deploys successfully

## 📝 Overall Assessment
**Recommendation**: [APPROVE / APPROVE WITH CONDITIONS / REJECT]
**Risk Level**: [Low / Medium / High]
```

## Common Anti-Patterns

### React/NX
1. **Direct MUI imports** in shared components
2. **Relative imports** across library boundaries
3. **Missing UI Adapter** wrapper
4. **String MAS comparisons** without conversion
5. **localStorage for app state**

### Web Components
1. **Missing HiddenFieldOldView** for form data
2. **Non-bubbling events** preventing monolith sync
3. **Global CSS** affecting Core checkout

### Shopify Extensions
1. **Direct Core API calls** (bypassing CheckoutService)
2. **Missing error boundaries**
3. **console.log** instead of useLogger
4. **Missing metafield cleanup**

## Resources

- **Architecture**: See `ai_overview.md` — Apps section
- **Web Components**: Skill `.cursor/skills/web-component-creation/`
- **Shopify Extensions**: Skill `.cursor/skills/shopify-extension-creation/`
- **UI Adapter**: `libs/ui/ui-adapter/src/lib/ui-adapter.tsx`
- **NX Docs**: Use `nx_docs` MCP tool for latest patterns

## Tools

**Git:**
```bash
git diff develop...feature/BRANCH-NAME
git log develop..feature/BRANCH-NAME --oneline --no-merges
```

**NX:**
```bash
nx show projects --affected --base=develop --head=HEAD
nx graph --affected
nx lint AFFECTED_PROJECT
nx test AFFECTED_PROJECT
```

**MCP:**
- `nx_docs` — Get up-to-date NX documentation
- `mcp_atlassian_getJiraIssue` — Get Jira context
