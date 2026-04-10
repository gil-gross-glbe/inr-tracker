---
name: pr-review-methodology
description: Comprehensive PR review methodology for Global-E repositories following 6-phase framework. Use when reviewing pull requests, code changes, or when user asks for PR review. Covers Core monolith, Apps NX monorepo, CheckoutService API, and AddressValidation service with repository-specific safety patterns and checklists.
---

# PR Review Methodology

## Quick Start

Use this methodology when:
- User requests PR review or code review
- Analyzing pull request changes
- Reviewing code changes before merge
- Validating implementation against team standards

**Primary Tool**: Use git diff to analyze PR changes:
```bash
# Compare feature branch to base branch
git diff develop...feature/BRANCH-NAME

# Or for specific files
git diff develop...feature/BRANCH-NAME -- path/to/file

# Get commit list
git log develop..feature/BRANCH-NAME --oneline --no-merges
```

## 6-Phase Review Framework

### Phase 1: Context Gathering
**Goal**: Understand what the PR is solving and why

1. **Jira Story Analysis**
   - If you can't read Jira item STOP! and tell human about it.
   - Get primary Jira ticket: `mcp_atlassian_getJiraIssue(issueIdOrKey: "CORE-XXXXX")`
   - read also epic and confluance pages staach to it
   - Understand business context, acceptance criteria, related stories
   - Identify dependencies and parent epics

2. **Architectural Context**
   - Search codebase for existing patterns: `codebase_search("How does [feature] work?")`
   - Find similar implementations for consistency checks
   - Identify configuration patterns and safety mechanisms

3. **Configuration Analysis** (Core-specific)
   - Check for `CountryToCountrySettingNames` changes
   - Verify migration requirements and backward compatibility
   - Assess merchant impact

### Phase 2: Technical Analysis
**Goal**: Assess code quality and architecture alignment

**Core Principles to Verify:**
- ✅ Progressive Enhancement (opt-in overlays, not replacements)
- ✅ Feature Flag Isolation (no leakage when disabled)
- ✅ Backward Compatibility (existing merchants unaffected)
- ✅ Validation Sacred Principle (UI changes only AFTER backend validation)
- ✅ Error Handling (comprehensive try-catch with structured logging)

**Code Quality Checks:**
- Backend (C#): PascalCase methods, DI patterns, error handling, test coverage
- Frontend (JS): Prototype patterns, event delegation, analytics integration
- React/TypeScript: Component patterns, state management, type safety

**Breaking Changes Detection:**
- Configuration format changes
- API signature modifications
- CSS class name changes (skin collision risk)
- Resource key modifications
- Database schema changes

### Phase 3: Safety Pattern Validation
**Goal**: Ensure production safety patterns are followed

**Critical Checks:**
1. **Feature Flag Isolation**
   ```csharp
   if (featureFlags.IsFeatureEnabled(merchantId, "FeatureName")) {
       // New implementation
   } else {
       // Legacy implementation (must exist)
   }
   ```
   - Verify no functionality leaks when flag disabled
   - Check both paths are implemented

2. **CSS/Skin Collision Prevention** (Core)
   - Scoped CSS files only (feature-specific, not global)
   - Feature-specific class names (e.g., `.payment-a11y-enabled`)
   - CSS loaded conditionally with feature flags
   - Document merchant skin risk assessment

3. **Configuration Migration** (if applicable)
   - Migration script exists
   - Backward compatibility layer
   - Default value handling
   - Rollback strategy

### Phase 4: Implementation Deep Dive (45-60 min)
**Goal**: Detailed analysis of implementation quality

**Backend Analysis:**
- Business logic correctness
- Service integration patterns
- Performance implications
- Data validation patterns
- API contract compliance

**Frontend Analysis:**
- Component architecture
- State management (Zustand for Apps, jQuery patterns for Core)
- Accessibility compliance (WCAG 2.2 AA)
- Cross-browser compatibility
- Error boundaries and fallbacks

**Database & Configuration:**
- Schema changes and migrations
- Index requirements
- Performance impact
- Data integrity

### Phase 5: Risk Assessment 
**Goal**: Categorize issues by severity and impact

**🚨 Critical (Must Fix Before Merge)**
- Breaking configuration changes without migration
- Missing feature flag isolation
- Security vulnerabilities
- Payment processing logic modifications
- Performance regressions

**⚠️ Medium (Should Fix Before Merge)**
- Code quality issues
- Naming inconsistencies
- Missing error handling
- Incomplete testing
- Documentation gaps

**ℹ️ Low (Nice to Have)**
- Code optimization opportunities
- Style improvements
- Additional logging
- Enhanced comments

**Merchant Impact Assessment:**
- Classic Checkout platforms (SFCC, GEM, Magento)
- Custom merchant skins
- Existing configurations
- Analytics and tracking
- Performance characteristics

### Phase 6: Deployment Readiness (10-15 min)
**Goal**: Verify production readiness

**Pre-Production Checklist:**
- [ ] Feature flags implemented and tested
- [ ] Migration scripts created (if needed)
- [ ] Comprehensive testing completed
- [ ] Performance testing done
- [ ] Security review completed
- [ ] Documentation updated
- [ ] Rollback strategy defined
- [ ] Monitoring alerts configured

## Repository-Specific Patterns

See [repository-patterns.md](repository-patterns.md) for detailed checklists. Quick reference:

**globale.core (ASP.NET MVC Monolith):**
- Feature flag isolation mandatory
- Scoped CSS files only
- Backward compatibility critical
- jQuery-dependent code preservation
- Custom skin collision prevention

**globale.checkout.apps (NX Monorepo - React/TypeScript):**
- Dual-platform components (Classic + Shopify)
- Zustand state management
- NX workspace patterns
- Web component deployment (S3)
- Shopify UI extensions patterns

**globale.checkout.checkoutservice (.NET Core API):**
- Redis caching patterns
- Service layer architecture
- API contract compliance
- Error handling and logging
- Integration with Core expose controllers

**globale.checkout.addressvalidation (.NET 7 Microservice):**
- Provider integration patterns
- Transliteration services
- Country configuration management
- Performance optimization

## Review Output Template

```markdown
# PR Review: [FEATURE_NAME] - [JIRA_ID]

## 🎯 Executive Summary
[Brief overview of changes and overall assessment]

## 📊 Context Analysis
- **Primary Story**: [Jira link and description]
- **Business Value**: [What problem this solves]
- **Technical Approach**: [High-level implementation strategy]

## ✅ Architecture & Code Quality Assessment

### Strengths
- [List positive aspects with specific examples]

### Areas of Concern
- [List issues with severity and specific examples]

## ⚠️ Critical Safety Concerns

### 🚨 High Priority
- [Breaking changes, security issues, missing feature flags]

### ⚠️ Medium Priority
- [Code quality, performance, testing gaps]

## 🔧 Code Quality Issues
[Detailed technical feedback with examples]

## 🧪 Testing Recommendations
[Specific test scenarios and coverage requirements]

## 🚀 Pre-Production Checklist
[Must-complete items before deployment]

## 📈 Performance & Scalability
[Impact analysis and recommendations]

## 🔄 Deployment Strategy
[Rollout plan, monitoring, rollback procedures]

## 📝 Overall Assessment
**Recommendation**: [APPROVE / APPROVE WITH CONDITIONS / REJECT]
**Risk Level**: [Low / Medium / High]
**Estimated Time to Address**: [X days/hours]

### Conditions for Approval (if applicable)
- [Specific requirements that must be met]
```

## Critical Safety Checks

Before approving any PR, verify:

1. **Feature Flag Isolation** ✅
   - New features gated by feature flags
   - Legacy path still works when flag disabled
   - No functionality leakage

2. **CSS/Skin Safety** ✅ (Core only)
   - Scoped CSS files, not global modifications
   - Feature-specific class names
   - Conditional CSS loading

3. **Backward Compatibility** ✅
   - Existing merchants unaffected
   - Configuration migrations handled
   - API contracts maintained

4. **Validation Order** ✅
   - UI changes only after backend validation
   - No client-side-only validation for critical operations

5. **Error Handling** ✅
   - Comprehensive try-catch blocks
   - Structured logging
   - Graceful degradation

## Tools & Resources

**MCP Tools:**
- `mcp_atlassian_getJiraIssue()` - Get story context
- `mcp_atlassian_searchJiraIssuesUsingJql()` - Find related tickets

**Git Commands:**
- `git diff develop...feature/BRANCH-NAME` - Get PR diff
- `git log develop..feature/BRANCH-NAME --oneline --no-merges` - Get commit list

**Memory Bank References:**
- Detailed methodology: `/GlobalE/memory-bank/pr-review-methodology.md`
- Repository patterns: `/GlobalE/memory-bank/ai-overview.md`
- Safety patterns: `/GlobalE/memory-bank/core/production-incident-prevention.md`
- Accessibility: `/GlobalE/memory-bank/core/accessibility-implementation-patterns.md`

**Additional Resources:**
- Repository-specific patterns: [repository-patterns.md](repository-patterns.md)
- Detailed phase guidance: [reference.md](reference.md)

## Best Practices

**DO:**
- ✅ Always get Jira context first
- ✅ Verify against established safety patterns
- ✅ Provide specific code examples for issues
- ✅ Consider merchant impact across all platforms
- ✅ Balance thoroughness with practical timelines

**DON'T:**
- ❌ Review without understanding business context
- ❌ Focus only on style issues
- ❌ Miss configuration migration requirements
- ❌ Ignore merchant impact considerations
- ❌ Approve without proper testing validation

## Common Anti-Patterns to Watch For

**Review Anti-Patterns:**
- Superficial code scanning without context
- Focusing only on style instead of architecture
- Missing configuration migration requirements
- Ignoring merchant impact considerations

**Implementation Anti-Patterns:**
- Adding features without feature flag protection
- Modifying validation logic without extreme caution
- Breaking backward compatibility without migration
- Changing global CSS without scoped alternatives
- Implementing UI changes before backend validation
