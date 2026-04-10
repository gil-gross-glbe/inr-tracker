---
name: release-notes
description: Standardized process for creating release notes for any Global-E repository using git analysis and Atlassian MCP tools. Use when creating release notes, updating Confluence release pages, or analyzing git changes for a release.
version: 1.0.0
last_updated: 2026-02-24
---

# Release Notes Creation Process

Applicable to all Global-E repositories: globale.core, globale.checkout.checkoutservice, globale.checkout.apps, globale.checkout.addressvalidation.

## Prerequisites

- Git access to the repository
- Atlassian MCP configured (see `atlassian-mcp` skill)
- Cloud ID: `97dda470-29da-47e8-b3a8-ee663b322db9`
- Information needed: repo name, previous release branch, target branch, Confluence page ID, release date

---

## Step 1: Analyze Git Changes

```bash
cd C:\GlobalE\[REPOSITORY-NAME]
git fetch origin
git log origin/[PREVIOUS-RELEASE]..origin/develop --oneline --no-merges
```

PowerShell tip: use `--no-pager` or `git config core.pager cat` if pager causes issues.

From commits, extract: Jira ticket numbers, commit messages, PR numbers, authors.

Group by: Jira Story → Feature Area → Type (Feature/Enhancement/Bug Fix) → Priority.

## Step 2: Categorize Changes

**Backend (.NET Core/.NET 7):** API Endpoints, Performance & Caching, Integrations, Bug Fixes, Infrastructure

**Frontend (React/NX Apps):** UI Components, User Experience & A11y, State Management, Bug Fixes

**Core Monolith (ASP.NET MVC):** Business Logic & Controllers, Views & UI (with feature flags), Backward Compatibility, Integrations & Expose Controllers

## Step 3: Structure Release Notes

### Confluence Format Template
```markdown
[Branch URL Link]

Deployed to STG INT and prod [DATE or TBD]

# [Repository Name] Release Notes - Recent Merges

## [Category Name]

* [Full-Jira-URL] - [Brief Description]. [Business impact] ([Context: Multiple commits / PR #XXX])
```

### Example Entry
```markdown
## Analytics Service Enhancements

* https://global-e.atlassian.net/browse/CORE-166294 - Fixed VWO ClientId handling to prevent data anonymization. Improves analytics accuracy for client tracking (Multiple commits)
```

## Step 4: Best Practices

**DO:**
- Link every Jira ticket with full URL: `https://global-e.atlassian.net/browse/CORE-XXXXX`
- Group related commits by story/feature (not individual commits)
- Lead with business value, add technical details in parentheses
- Match format of previous releases for consistency
- Start with action verbs: Fixed, Added, Enhanced, Improved
- Add context indicators: "(Multiple commits)", "(PR #XXX)", "(Breaking change)"

**DON'T:**
- List individual commits separately if part of same story
- Use only technical jargon without business context
- Mix different Jira tickets in single bullet point
- Forget deployment date (use TBD if unknown)

## Step 5: Update Confluence Using MCP

```
1. getAccessibleAtlassianResources() → verify cloud ID
2. getConfluencePage(cloudId, pageId: PREVIOUS_RELEASE) → match format
3. getConfluencePage(cloudId, pageId: TARGET_PAGE) → get current content
4. updateConfluencePage(cloudId, pageId: TARGET_PAGE, body: FULL_MARKDOWN, versionMessage: "Added release notes for [version]")
```

**Critical**: Confluence auto-converts Markdown. Jira URLs become smart links. Use `* ` for bullets, `## ` for headers.

## Step 6: Create Supporting Documentation (Optional)

Generate these files in the repository **only when explicitly requested**:

| File | Purpose |
|------|---------|
| `RELEASE_NOTES.md` | Detailed technical notes with business impact |
| `RELEASE_SUMMARY.md` | Executive summary for stakeholders |
| `CHANGELOG_DRAFT.md` | Standard Added/Changed/Fixed/Removed format |
| `RELEASE_QUICK_REFERENCE.md` | Operations quick-reference card |

---

## Quality Checklist

### Content
- [ ] All Jira tickets linked with full URLs
- [ ] Each item has clear business value explanation
- [ ] Related commits grouped by story (not listed individually)
- [ ] No duplicate entries

### Format
- [ ] Follows same structure as previous releases
- [ ] Headers consistent (H1 title, H2 categories)
- [ ] Branch URL at the top
- [ ] Deployment date specified (or TBD)

### Repository-Specific

**Core:** Custom skin impact assessed, feature flags documented, backward compatibility verified

**Checkout Service:** API endpoints documented, caching behavior explained, integration points noted

**Apps:** Platform compatibility noted (Classic + Shopify), accessibility improvements documented

---

## Repository Branch Patterns

| Repository | Branch URL | Main Branch |
|------------|-----------|-------------|
| Core | `https://bitbucket.org/globaleteam/globale.core/branch/develop` | `master` |
| Checkout Service | `https://bitbucket.org/globaleteam/globale.checkout.checkoutservice/branch/develop` | `develop` |
| Apps | `https://bitbucket.org/globaleteam/globale.checkout.apps/branch/main` | `main` |

## Git Analysis Tips

```bash
# Count commits
git rev-list --count origin/[PREVIOUS]..origin/develop --no-merges

# Filter by path
git log origin/[PREVIOUS]..origin/develop --oneline --no-merges -- src/

# Group by author
git shortlog origin/[PREVIOUS]..origin/develop --no-merges

# Search for Jira tickets
git log origin/[PREVIOUS]..origin/develop --no-merges --grep="CORE-"
```

## Confluence Space Structure

```
CD Space → Release Notes/
├── Checkout-service/ (2025.10.R1, 2025.11.01, ...)
├── Core/ (version releases)
└── Apps/ (version releases)
```

Find page IDs: extract from URL or use `searchConfluenceUsingCql(cloudId, cql: "space=CD AND title~'...'")`.

---

**Process Owner:** Gil (Team Lead - Shopify Checkout Team)
**Confluence Space:** CD (Checkout Domain)
