# PR Review Methodology - Detailed Reference

This file provides detailed guidance for each phase of the PR review process. For quick reference, see [SKILL.md](SKILL.md).

## Memory Bank Reference

**Primary Source**: `/GlobalE/memory-bank/pr-review-methodology.md`

This comprehensive guide contains:
- Complete 6-phase review framework with time estimates
- Detailed phase-by-phase instructions
- Code examples and patterns
- Review output templates
- Best practices and anti-patterns
- Success metrics

## Phase 1: Context Gathering (Detailed)

### 1.1 Jira Story Analysis

**Tools:**
```javascript
mcp_atlassian_getJiraIssue({
  cloudId: "https://global-e.atlassian.net",
  issueIdOrKey: "CORE-XXXXX"
})
```

**What to Extract:**
- **Primary Story**: Main feature/bug being addressed
- **Related Stories**: Parent epics, linked issues, dependencies
- **Business Context**: Problem statement, user impact, merchant value
- **Acceptance Criteria**: Expected outcomes, success metrics
- **Technical Requirements**: Constraints, integration points

**Questions to Answer:**
- What problem does this solve?
- Who benefits from this change?
- What are the success criteria?
- Are there related stories or dependencies?

### 1.2 Architectural Context Search

**Tools:**
```javascript
codebase_search("How does [feature area] currently work?", target_directories: [])
grep("pattern or class name", path: "repository-path")
```

**What to Find:**
- **Existing Implementation**: Current architecture and patterns
- **Similar Features**: Comparable implementations for consistency
- **Configuration Patterns**: How settings are managed
- **Safety Patterns**: Feature flags, progressive enhancement patterns
- **Integration Points**: Dependencies, service boundaries

**Key Patterns to Identify:**
- Feature flag usage patterns
- CSS scoping strategies
- State management approaches
- Error handling patterns
- Testing strategies

### 1.3 Configuration Analysis (Core-Specific)

**Critical Checks:**
```bash
grep("CountryToCountrySettingNames", path: "core")
read_file("core/Model/Shipping/CountryToCountrySettingNames.cs")
```

**What to Verify:**
- New `CountryToCountrySettingNames` entries
- Migration requirements for breaking changes
- Backward compatibility impact
- Default value handling
- Merchant configuration impact

## Phase 2: Technical Analysis (Detailed)

### 2.1 Architecture Assessment

**Core Principles Checklist:**

**Progressive Enhancement:**
- ✅ New features are opt-in overlays
- ✅ Not replacing existing functionality
- ✅ Graceful degradation when disabled
- ✅ No breaking changes to existing flows

**Feature Flag Isolation:**
- ✅ Feature flag gates all new functionality
- ✅ Legacy path still works when flag disabled
- ✅ No functionality leakage when disabled
- ✅ Both paths tested independently

**Backward Compatibility:**
- ✅ Existing merchants unaffected
- ✅ API contracts maintained
- ✅ Configuration formats preserved
- ✅ Database schema changes are additive

**Validation Sacred Principle:**
- ✅ UI changes only after backend validation
- ✅ Client-side validation is supplementary
- ✅ Critical operations validated server-side
- ✅ State synchronization after validation

**Error Handling:**
- ✅ Comprehensive try-catch blocks
- ✅ Structured logging with context
- ✅ User-friendly error messages
- ✅ Graceful error recovery

### 2.2 Code Quality Review

**Backend (C#) Standards:**
- Method naming: `PascalCase` for public, `_camelCase` for private
- Dependency injection: Constructor injection preferred
- Error handling: Try-catch with logging, never swallow exceptions
- Business logic: Separated from controllers, in service layer
- Unit tests: Critical paths covered, edge cases tested

**Frontend (JavaScript) Standards:**
- Naming: `CheckoutManagerV2.prototype.MethodName` pattern
- Error handling: `Utils.SafeExecute(Utils.WriteLog)` wrapper
- Event delegation: `$(document).on()` for dynamic content
- Analytics: Proper tracking integration
- State management: Clear state transitions

**React/TypeScript Standards:**
- Components: Functional components with hooks
- Type safety: Proper TypeScript types, no `any`
- State management: Zustand for Apps, avoid localStorage
- Error boundaries: Implemented for error recovery
- Accessibility: ARIA labels, keyboard navigation

### 2.3 Breaking Changes Detection

**High-Risk Areas:**

1. **Configuration Format Changes**
   - `long` → `JSON` requires migration
   - New required fields need defaults
   - Deprecated fields need deprecation path

2. **API Signature Modifications**
   - Parameter changes break callers
   - Return type changes break consumers
   - Endpoint removal needs deprecation period

3. **CSS Class Name Changes**
   - Merchant skin collision risk
   - Custom CSS dependencies
   - Visual regression potential

4. **Resource Key Modifications**
   - Localization impact
   - Missing translations
   - Fallback behavior

5. **Database Schema Changes**
   - Migration scripts required
   - Data loss prevention
   - Rollback capability

## Phase 3: Safety Pattern Validation (Detailed)

### 3.1 Feature Flag Requirements

**Mandatory Pattern:**
```csharp
if (featureFlags.IsFeatureEnabled(merchantId, "FeatureName")) {
    // New implementation
    return newFeatureImplementation();
} else {
    // Legacy implementation (MUST exist)
    return legacyImplementation();
}
```

**Verification Checklist:**
- [ ] Feature flag name is descriptive and follows naming convention
- [ ] Both new and legacy paths are implemented
- [ ] Legacy path is tested independently
- [ ] No functionality leaks when flag disabled
- [ ] Feature flag is documented in Jira ticket
- [ ] Rollback strategy uses feature flag

**Common Mistakes:**
- ❌ Only implementing new path
- ❌ Assuming flag is always enabled
- ❌ Leaking functionality when flag disabled
- ❌ Not testing both paths

### 3.2 CSS/Skin Collision Prevention (Core)

**Required Pattern:**
```css
/* ✅ GOOD: Scoped CSS file */
.payment-a11y-enabled .radio-button {
    /* Feature-specific styles */
}

/* ❌ BAD: Global CSS modification */
.radio-button {
    /* Breaks merchant skins */
}
```

**Verification Checklist:**
- [ ] CSS file is feature-specific (e.g., `paymentMethodsA11y.css`)
- [ ] CSS loaded conditionally with feature flag
- [ ] All styles scoped with feature-specific class
- [ ] No global CSS modifications
- [ ] Merchant skin risk assessment completed
- [ ] Tested with custom skins on QA merchants

**Risk Assessment SQL:**
```sql
-- Identify merchants with custom skins
SELECT MerchantId, CustomCheckoutStyle 
FROM MerchantAppSettings 
WHERE CustomCheckoutStyle IS NOT NULL
```

### 3.3 Configuration Migration Strategy

**Required Components:**
1. **Migration Script**
   - Converts old format to new format
   - Handles edge cases and invalid data
   - Idempotent (can run multiple times safely)

2. **Backward Compatibility Layer**
   - Reads both old and new formats
   - Defaults for missing values
   - Deprecation warnings

3. **Default Value Handling**
   - Sensible defaults for new fields
   - Migration path for missing data
   - Validation of migrated data

4. **Rollback Strategy**
   - Ability to revert to old format
   - Data preservation during rollback
   - Clear rollback procedure

## Phase 4: Implementation Deep Dive (Detailed)

### 4.1 Backend Changes Analysis

**Business Logic (BL/) Review:**
- Core business rules correctness
- Integration with existing services
- Performance implications (N+1 queries, caching)
- Data validation patterns
- Transaction boundaries

**Models & DTOs Review:**
- Data structure changes
- Serialization considerations (JSON, XML)
- API contract modifications
- Backward compatibility
- Validation attributes

**Controllers & APIs Review:**
- Endpoint modifications
- Request/response changes
- Error handling (status codes, error messages)
- Authentication/authorization
- Rate limiting and throttling

### 4.2 Frontend Changes Analysis

**JavaScript Patterns Review:**
- Prototype-based inheritance maintenance
- Event handling and delegation
- Async operation patterns (Promises, async/await)
- State synchronization
- Modal and popup implementations

**React/TypeScript Patterns Review:**
- Component architecture (composition vs inheritance)
- State management (Zustand stores)
- Effect hooks (useEffect dependencies)
- Memoization (useMemo, useCallback)
- Error boundaries

**UI/UX Changes Review:**
- Accessibility compliance (WCAG 2.2 AA)
- Mobile responsiveness
- Cross-browser compatibility
- User experience improvements
- Loading states and error states

### 4.3 Database & Configuration Review

**Schema Modifications:**
- Migration scripts created
- Index requirements (performance)
- Foreign key constraints
- Data integrity checks

**Performance Impact:**
- Query optimization
- Index usage
- Connection pooling
- Caching strategies

**Data Migration Needs:**
- Migration scripts tested
- Data validation after migration
- Rollback capability
- Performance impact assessment

## Phase 5: Risk Assessment (Detailed)

### Risk Categorization Framework

**🚨 Critical Risk Indicators:**
- Breaking configuration changes without migration
- Missing feature flag isolation
- Security vulnerabilities (SQL injection, XSS, CSRF)
- Payment processing logic modifications
- Performance regressions (>20% slower)
- Data loss potential
- Service disruption risk

**⚠️ Medium Risk Indicators:**
- Code quality issues (naming, structure)
- Missing error handling
- Incomplete testing coverage
- Documentation gaps
- Minor performance concerns
- Limited backward compatibility impact

**ℹ️ Low Risk Indicators:**
- Code optimization opportunities
- Style improvements
- Additional logging for debugging
- Enhanced comments
- Refactoring opportunities

### Merchant Impact Assessment

**Integration Points to Consider:**
- Classic Checkout platforms (SFCC, GEM, Magento)
- Custom merchant skins
- Existing configurations
- Analytics and tracking
- Performance characteristics
- Third-party integrations

**Questions to Answer:**
- Which merchants are affected?
- What is the rollback impact?
- Are there customizations that break?
- Is monitoring in place?
- What is the user impact?

## Phase 6: Deployment Readiness (Detailed)

### Pre-Production Checklist

**Feature Flags:**
- [ ] Feature flags implemented and tested
- [ ] Both enabled and disabled paths tested
- [ ] Feature flag documentation updated
- [ ] Rollback strategy uses feature flags

**Migrations:**
- [ ] Migration scripts created and tested
- [ ] Backward compatibility verified
- [ ] Rollback scripts prepared
- [ ] Data validation after migration

**Testing:**
- [ ] Unit tests written and passing
- [ ] Integration tests completed
- [ ] Manual testing on QA environment
- [ ] Cross-browser testing (if UI changes)
- [ ] Performance testing completed
- [ ] Security testing completed

**Documentation:**
- [ ] Code comments updated
- [ ] API documentation updated
- [ ] Configuration documentation updated
- [ ] Deployment notes prepared

**Monitoring:**
- [ ] Error tracking configured
- [ ] Performance monitoring setup
- [ ] Business metrics tracking
- [ ] Alert thresholds defined

**Rollback Strategy:**
- [ ] Rollback procedure documented
- [ ] Rollback triggers defined
- [ ] Rollback tested in staging
- [ ] Data preservation verified

### Testing Strategy

**Critical Test Scenarios:**
- Edge case validation
- Configuration migration testing
- Cross-browser/device testing
- Performance under load
- Security penetration testing
- Merchant-specific testing
- Feature flag toggle testing
- Error condition testing

### Monitoring & Analytics

**Error Tracking:**
- Exception logging configured
- Error aggregation setup
- Alert thresholds defined
- Error rate monitoring

**Performance Monitoring:**
- Response time tracking
- Throughput monitoring
- Resource utilization
- Database query performance

**Business Metrics:**
- User behavior tracking
- Conversion rate monitoring
- Feature adoption metrics
- Business KPI tracking

## Review Output Best Practices

**Structure:**
- Start with executive summary
- Provide context and business value
- List strengths before concerns
- Categorize issues by severity
- End with clear recommendation

**Tone:**
- Constructive and helpful
- Specific with code examples
- Actionable recommendations
- Respectful of development effort
- Balanced (praise good work too)

**Format:**
- Use emojis for visual scanning (🚨 ⚠️ ℹ️ ✅)
- Code blocks for examples
- Checklists for actionable items
- Clear severity indicators
- Specific file/line references

## Common Pitfalls

**Reviewer Pitfalls:**
- Reviewing without context
- Focusing only on style
- Missing configuration migrations
- Ignoring merchant impact
- Approving without testing validation

**Implementation Pitfalls:**
- Missing feature flags
- Modifying validation logic carelessly
- Breaking backward compatibility
- Changing global CSS
- UI changes before backend validation
