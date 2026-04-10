---
name: web-component-creation
description: Guide for creating, modifying, and debugging publishable React web components that integrate with the Core monolith. Covers hidden inputs, DOM events, UI Adapter pattern, r2wc registration, S3 deployment, and MAS settings. Use when working on publishable components, web component ↔ monolith communication, or address form.
version: 1.0.0
last_updated: 2026-02-25
---

# Web Component ↔ Monolith Integration

## When to Use

- Creating a new publishable web component
- Modifying address-form, payment-additional-fields, or any publishable component
- Debugging communication between React components and the Core monolith
- Adding hidden inputs or DOM event dispatching
- Implementing the UI Adapter pattern for cross-platform components

## Architecture

React web components from Apps live **inside** Core's `<form>` element in `checkout.cshtml`. They communicate via two channels:

```
┌──── MONOLITH (Core - ASP.NET MVC) ────────────────────────────┐
│  checkout.cshtml                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  <form id="checkoutForm">                                │  │
│  │      <address-form json-data="..." settings="...">       │  │
│  │          ┌── REACT WEB COMPONENT (S3) ──────────────┐    │  │
│  │          │  AddressFormContainer                     │    │  │
│  │          │    └─ UIAdapterProvider                    │    │  │
│  │          │        └─ AddressFormSection               │    │  │
│  │          │            ├─ Visible fields               │    │  │
│  │          │            └─ HiddenFieldOldView × N       │    │  │
│  │          │                → <input type="hidden" ...> │    │  │
│  │          └──────────────────────────────────────────────┘    │  │
│  │  </form>                                                │  │
│  │  jQuery handlers listen for DOM events on inputs        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  On form submit → reads all <input> values → sends to backend  │
└────────────────────────────────────────────────────────────────┘
```

## Channel 1: Hidden `<input>` Elements (Primary)

React renders hidden inputs inside the form. Monolith reads them on submit.

**Flow:**
1. User interacts with React component
2. Component updates Zustand store via `setHiddenFormFieldValue(fieldType, value)`
3. `HiddenFieldOldView` reads from store via `selectHiddenFieldValue`
4. React re-renders → DOM hidden input value updates
5. Monolith form submission reads the hidden input value

**Key files:**
- `libs/address-form-monolith/src/lib/address-form-store/hidden-form-fields.slice.ts`
- `libs/address-form-monolith/src/lib/address-form-hidden-fields-base/views/hidden-field-old.tsx`
- `libs/address-form-monolith/src/lib/address-form-models/enums/HiddenAddressFormFieldType.ts`

## Channel 2: DOM `change` Events (Real-time Sync)

For real-time updates before form submit:

```typescript
hiddenInputRef?.current?.dispatchEvent(new Event('change', { bubbles: true }));
```

**`bubbles: true`** is critical — monolith jQuery handlers listen on parent elements.

## Step-by-Step: Creating a New Web Component

### Step 1: Scaffold the Library

```bash
nx g @nx/react:library my-component-name --directory=libs/publishable-components/my-component-container --buildable
```

### Step 2: Create the Wrapper (r2wc Registration)

```typescript
// my-component-container-wrapper.tsx
import r2wc from '@r2wc/react-to-web-component';
import { MyComponent } from './my-component';

const MyComponentWrapper = r2wc(MyComponent, {
  props: {
    MerchantId: 'number',
    CountryCode: 'string',
    jsonData: 'json',
    Settings: 'json',
    Resources: 'json',
  },
});

customElements.define('my-component', MyComponentWrapper);
```

### Step 3: Implement Hidden Inputs (if needed)

Use `HiddenFieldOldView` to render hidden inputs the monolith can read on form submit.

### Step 4: Implement DOM Events (if real-time sync needed)

Dispatch native `change` events with `bubbles: true` on hidden inputs.

### Step 5: Use UI Adapter Pattern (if cross-platform)

```typescript
<UIAdapterProvider components={{ PhoneField: MonolithPhoneField }}>
  <MyComponent />
</UIAdapterProvider>
```

**Key files:**
- `libs/ui/ui-adapter/src/lib/ui-adapter.tsx` — Provider + `useUI()` hook
- `libs/ui/phone-field/src/lib/adapters/monolith-phone-field.tsx` — Classic adapter

### Step 6: Configure CI/CD (if deployable to S3)

Add to `.gitlab-ci.yml`:
```json
"my-component-container": {
  "type": "node-s3",
  "defaults": {
    "s3_prefix": "Scripts/WebComponents",
    "build_path": "MyComponent"
  }
}
```

## MAS Settings Pattern

Boolean flags from monolith are passed via `Settings` JSON prop. **Always strings**.

```typescript
export const selectFormBooleanSetting = (state, settingName: string) => {
  return convertStringToBoolean(state.settings[settingName]);
};
```

**Known MAS settings:** `UsePhonePrefixComponent`, `SplitPhonePrefixLayout`, `ShowCountryFlagInDropdown`, `IsRtl`, `IsFloatingLabelSupported`, `IsEmailChangeAllowed`, `UseNewAddressFormAPI`, `IsAddressAutoCompleteEnterManuallyEnabled`, `IsContainVirtualProductsOnly`, `WebComponentScriptFolderUrl`

## Critical Rules

1. Hidden inputs must be inside the `<form>` — monolith reads them on submit
2. DOM events need `bubbles: true` for jQuery handler propagation
3. Use UI Adapter pattern for any component that must work on Classic + Shopify
4. MAS settings are strings — always use `convertStringToBoolean()` or `selectFormBooleanSetting()`
5. Use Zustand for state management, never localStorage/sessionStorage
