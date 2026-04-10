# Repository-Specific PR Review Patterns

This file provides repository-specific checklists and patterns for PR reviews. Use these alongside the main methodology in [SKILL.md](SKILL.md).

## globale.core (ASP.NET MVC Monolith)

### Critical Safety Checks

**Feature Flag Isolation:**
- [ ] All new features gated by feature flags
- [ ] Legacy implementation path exists and works
- [ ] No functionality leaks when flag disabled
- [ ] Feature flag tested in both enabled/disabled states
- [ ] Rollback strategy uses feature flag

**CSS/Skin Collision Prevention:**
- [ ] Scoped CSS files only (feature-specific, not global)
- [ ] Feature-specific class names (e.g., `.payment-a11y-enabled`)
- [ ] CSS loaded conditionally with feature flags
- [ ] No modifications to global CSS files
- [ ] Merchant skin risk assessment completed
- [ ] Tested with custom skins on QA merchants

**Backward Compatibility:**
- [ ] jQuery-dependent code preserved
- [ ] HTML element IDs/classes unchanged (or documented)
- [ ] Custom skin compatibility verified
- [ ] Existing merchant configurations unaffected
- [ ] API contracts maintained

**Configuration Changes:**
- [ ] `CountryToCountrySettingNames` changes documented
- [ ] Migration scripts created (if format changed)
- [ ] Backward compatibility layer implemented
- [ ] Default values provided for new settings
- [ ] Rollback strategy defined

### Code Quality Patterns

**Backend (C#):**
- [ ] Methods use `PascalCase` naming
- [ ] Dependency injection used (constructor injection)
- [ ] Error handling with try-catch and logging
- [ ] Business logic in BL/ layer, not controllers
- [ ] Unit tests for critical paths

**Frontend (JavaScript):**
- [ ] Prototype pattern: `CheckoutManagerV2.prototype.MethodName`
- [ ] Error handling: `Utils.SafeExecute(Utils.WriteLog)`
- [ ] Event delegation: `$(document).on()` for dynamic content
- [ ] Analytics integration present
- [ ] Modal/UI state management clear

**Razor Views:**
- [ ] View components used for reusable UI
- [ ] Partial views properly structured
- [ ] No business logic in views
- [ ] Proper model binding

### Testing Requirements

- [ ] Unit tests for business logic
- [ ] Integration tests for controllers
- [ ] Manual testing on QA environment
- [ ] Cross-browser testing (if UI changes)
- [ ] Custom skin testing (if CSS changes)
- [ ] Feature flag toggle testing

### Deployment Considerations

- [ ] IIS deployment compatibility
- [ ] Database migration scripts (if schema changes)
- [ ] Configuration updates documented
- [ ] Monitoring alerts configured
- [ ] Rollback procedure tested

---

## globale.checkout.apps (NX Monorepo - React/TypeScript)

### Critical Safety Checks

**Dual-Platform Compatibility:**
- [ ] Components work in Classic Checkout context
- [ ] Components work in Shopify C1 context
- [ ] Platform detection logic correct
- [ ] No platform-specific code leaks

**State Management:**
- [ ] Zustand stores used (not localStorage/sessionStorage)
- [ ] State properly initialized
- [ ] State cleanup on unmount
- [ ] No state leakage between instances

**NX Monorepo Patterns:**
- [ ] Library boundaries respected
- [ ] Shared dependencies properly declared
- [ ] Build configuration correct
- [ ] Affected projects identified

**Shopify UI Extensions:**
- [ ] Extension targets correct (`purchase.checkout.*`)
- [ ] Conditional rendering with `isTargetSelected`
- [ ] Service code detection logic correct
- [ ] Error boundaries implemented
- [ ] Loading states handled

### Code Quality Patterns

**React/TypeScript:**
- [ ] Functional components with hooks
- [ ] Proper TypeScript types (no `any`)
- [ ] useEffect dependencies correct
- [ ] Memoization used appropriately (useMemo, useCallback)
- [ ] Error boundaries implemented

**Component Architecture:**
- [ ] Components are focused and reusable
- [ ] Props properly typed
- [ ] Default props provided
- [ ] Component composition over inheritance

**CSS Modules:**
- [ ] Scoped styles (CSS Modules)
- [ ] No global CSS pollution
- [ ] Responsive design implemented
- [ ] Accessibility styles (WCAG 2.2 AA)

**Web Components:**
- [ ] Custom elements properly defined
- [ ] Shadow DOM used appropriately
- [ ] Event handling correct
- [ ] Lifecycle hooks implemented

### Testing Requirements

- [ ] Unit tests with Jest
- [ ] Component tests with React Testing Library
- [ ] E2E tests with Playwright (if applicable)
- [ ] Manual testing in Classic Checkout
- [ ] Manual testing in Shopify C1
- [ ] Cross-browser testing

### Deployment Considerations

- [ ] Web components built and deployed to S3
- [ ] Shopify extensions deployed via Shopify CLI
- [ ] Version numbers updated
- [ ] NX affected projects identified
- [ ] Build artifacts verified

---

## globale.checkout.checkoutservice (.NET Core API)

### Critical Safety Checks

**API Design:**
- [ ] RESTful conventions followed
- [ ] Request/response models properly defined
- [ ] API versioning handled (if applicable)
- [ ] Error responses standardized
- [ ] API documentation updated

**Caching (Redis):**
- [ ] Caching strategy appropriate
- [ ] Cache keys properly namespaced
- [ ] Cache invalidation logic correct
- [ ] Cache TTL configured appropriately
- [ ] Fallback when cache unavailable

**Service Layer Architecture:**
- [ ] Business logic in Services layer
- [ ] Repository pattern used for data access
- [ ] Dependency injection configured
- [ ] AutoMapper profiles updated (if applicable)

**Integration with Core:**
- [ ] Expose controller endpoints used correctly
- [ ] Error handling for Core failures
- [ ] Timeout handling implemented
- [ ] Retry logic appropriate

### Code Quality Patterns

**.NET Core Best Practices:**
- [ ] Async/await used for I/O operations
- [ ] Dependency injection used
- [ ] Configuration from IConfiguration
- [ ] Logging with ILogger
- [ ] Exception handling with try-catch

**API Controllers:**
- [ ] Action methods properly attributed
- [ ] Model validation with DataAnnotations
- [ ] HTTP status codes correct
- [ ] Response types documented

**Services:**
- [ ] Single responsibility principle
- [ ] Interface-based design
- [ ] Error handling comprehensive
- [ ] Logging at appropriate levels

**Repositories:**
- [ ] Entity Framework used correctly
- [ ] Queries optimized (no N+1)
- [ ] Transactions used appropriately
- [ ] Connection management proper

### Testing Requirements

- [ ] Unit tests with NUnit/xUnit
- [ ] Integration tests for API endpoints
- [ ] Mock external dependencies
- [ ] Test error scenarios
- [ ] Performance testing (if applicable)

### Deployment Considerations

- [ ] Kubernetes deployment configuration
- [ ] Docker image built correctly
- [ ] Environment variables configured
- [ ] Redis connection configured
- [ ] Health checks implemented
- [ ] Monitoring and alerting setup

---

## globale.checkout.addressvalidation (.NET 7 Microservice)

### Critical Safety Checks

**Provider Integration:**
- [ ] Multiple provider support (Google Places, Loqate, Mock)
- [ ] Provider fallback logic correct
- [ ] API key management secure
- [ ] Rate limiting handled
- [ ] Error handling for provider failures

**Transliteration Services:**
- [ ] ICU library integration correct
- [ ] Kawazu integration correct (if used)
- [ ] Language detection accurate
- [ ] Transliteration quality verified

**Country Configuration:**
- [ ] Country configs properly structured
- [ ] Default values provided
- [ ] Validation logic correct
- [ ] Configuration updates tested

### Code Quality Patterns

**.NET 7 Patterns:**
- [ ] Minimal APIs used appropriately
- [ ] Async/await for I/O
- [ ] Dependency injection
- [ ] Configuration management
- [ ] Logging structured

**Service Resolution:**
- [ ] Multi-provider pattern implemented
- [ ] Service selection logic correct
- [ ] Provider priority handling
- [ ] Fallback mechanism working

**HTTP Clients:**
- [ ] HttpClientFactory used
- [ ] Retry policies configured
- [ ] Timeout handling
- [ ] Error handling comprehensive

### Testing Requirements

- [ ] Unit tests for business logic
- [ ] Integration tests for providers
- [ ] Mock provider responses
- [ ] Transliteration accuracy tests
- [ ] Country configuration tests

### Deployment Considerations

- [ ] Microservice deployment configuration
- [ ] Health checks implemented
- [ ] Monitoring configured
- [ ] API key rotation strategy
- [ ] Provider failover tested

---

## Cross-Repository Considerations

### Feature Flags
- [ ] Feature flags synchronized across repos (if needed)
- [ ] Flag names consistent
- [ ] Rollout strategy coordinated

### API Contracts
- [ ] API versioning handled
- [ ] Breaking changes communicated
- [ ] Deprecation notices provided

### Deployment Order
- [ ] Dependencies deployed first
- [ ] Deployment order documented
- [ ] Rollback order considered

### Monitoring
- [ ] Cross-service monitoring
- [ ] Error correlation
- [ ] Performance tracking

### Documentation
- [ ] API documentation updated
- [ ] Architecture diagrams updated
- [ ] Deployment notes prepared

---

## Quick Reference Checklist

### Before Approving Any PR

**All Repositories:**
- [ ] Jira story context understood
- [ ] Business value clear
- [ ] Tests written and passing
- [ ] Code quality standards met
- [ ] Documentation updated
- [ ] No breaking changes (or migrations provided)
- [ ] Error handling comprehensive
- [ ] Performance considered

**Core-Specific:**
- [ ] Feature flag isolation verified
- [ ] CSS scoped and conditional
- [ ] Backward compatibility maintained
- [ ] Custom skin impact assessed

**Apps-Specific:**
- [ ] Dual-platform compatibility verified
- [ ] Zustand state management used
- [ ] NX affected projects identified
- [ ] Shopify extensions tested

**CheckoutService-Specific:**
- [ ] Redis caching appropriate
- [ ] API contracts maintained
- [ ] Core integration tested
- [ ] Error handling comprehensive

**AddressValidation-Specific:**
- [ ] Provider integration tested
- [ ] Transliteration quality verified
- [ ] Country configs updated
- [ ] Fallback logic working
