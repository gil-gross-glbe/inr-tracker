---
name: atlassian-mcp
description: Guide for using Atlassian MCP tools (Confluence & Jira) with the Global-E ecosystem. Use when creating/updating Confluence pages, searching Jira issues, creating release notes, or any Atlassian integration task.
version: 1.0.0
last_updated: 2026-02-24
---

# Atlassian MCP Tools - Usage Guide

## Global-E Instance

- **Cloud ID**: `97dda470-29da-47e8-b3a8-ee663b322db9`
- **Site URL** (also works as cloudId): `https://global-e.atlassian.net`
- **Confluence Space**: CD (Checkout Domain)
- **Jira Project**: CORE

Always call `getAccessibleAtlassianResources()` at session start if unsure about cloud ID.

---

## Confluence Operations

### Read a Page
```
getConfluencePage(cloudId: "https://global-e.atlassian.net", pageId: "123456789")
```
Extract page ID from URL: `https://global-e.atlassian.net/wiki/spaces/CD/pages/6433407035/...` → `6433407035`

### Search Pages (CQL)
```
searchConfluenceUsingCql(cloudId: "https://global-e.atlassian.net", cql: "title ~ 'release notes' AND space = CD AND type = page", limit: 25)
```
Common CQL patterns: `space = CD`, `type = page`, `created >= 2025-01-01`, `label = 'production'`

### Create a Page
```
createConfluencePage(cloudId: "https://global-e.atlassian.net", spaceId: "NUMERIC_ID", title: "Page Title", body: "# Markdown content", parentId: "PARENT_PAGE_ID")
```
- Body **must** be Markdown format
- Get `spaceId` (numeric) via `getConfluenceSpaces(cloudId: "...", keys: ["CD"])`

### Update a Page (CRITICAL: Read-Modify-Update)
```
updateConfluencePage(cloudId: "https://global-e.atlassian.net", pageId: "123456789", body: "# FULL page content in Markdown", versionMessage: "Description of changes")
```
**Always read the page first** → modify content → update with **complete** body. Confluence replaces the entire page.

### List Pages in Space
```
getPagesInConfluenceSpace(cloudId: "...", spaceId: "NUMERIC_ID", limit: 50, sort: "-modified-date")
```

### Get Child Pages
```
getConfluencePageDescendants(cloudId: "...", pageId: "123456789")
```

### Comments
- **Footer**: `createConfluenceFooterComment(cloudId: "...", pageId: "...", body: "Markdown")`
- **Inline**: `createConfluenceInlineComment(cloudId: "...", pageId: "...", body: "...", inlineCommentProperties: {textSelection: "text", textSelectionMatchCount: N, textSelectionMatchIndex: 0})`

---

## Jira Operations

### Get Issue
```
getJiraIssue(cloudId: "https://global-e.atlassian.net", issueIdOrKey: "CORE-171294")
```

### Search Issues (JQL)
```
searchJiraIssuesUsingJql(cloudId: "https://global-e.atlassian.net", jql: "project = CORE AND status = Done AND updated >= -30d", maxResults: 50, fields: ["summary", "description", "status", "created"])
```
Common JQL:
- `project = CORE AND fixVersion = "2025.12.01"`
- `issue in (CORE-123, CORE-456)`
- `status changed TO "Done" DURING (-7d, now)`

### Create Issue
```
createJiraIssue(cloudId: "...", projectKey: "CORE", issueTypeName: "Task", summary: "Title", description: "Markdown description")
```
Get valid issue types: `getJiraProjectIssueTypesMetadata(cloudId: "...", projectIdOrKey: "CORE")`

### Update Issue
```
editJiraIssue(cloudId: "...", issueIdOrKey: "CORE-171294", fields: {summary: "Updated", description: "Updated"})
```

### Add Comment
```
addCommentToJiraIssue(cloudId: "...", issueIdOrKey: "CORE-171294", commentBody: "Markdown comment")
```

### Transition Issue
1. Get transitions: `getTransitionsForJiraIssue(cloudId: "...", issueIdOrKey: "CORE-171294")`
2. Apply: `transitionJiraIssue(cloudId: "...", issueIdOrKey: "...", transition: {id: "21"})`

### Lookup User
```
lookupJiraAccountId(cloudId: "...", searchString: "gil.gross@global-e.com")
```

---

## Key Workflows

### Workflow 1: Release Notes on Confluence
1. `getAccessibleAtlassianResources()` → get cloud ID
2. `getConfluenceSpaces(cloudId, keys: ["CD"])` → get space ID
3. `getConfluencePage(cloudId, pageId: PREVIOUS_RELEASE_PAGE)` → match format
4. `searchJiraIssuesUsingJql(cloudId, jql: "project = CORE AND fixVersion = '...'")` → get tickets
5. `createConfluencePage(...)` or `updateConfluencePage(...)` → publish

### Workflow 2: Document Code Changes in Jira
1. `getJiraIssue(cloudId, issueIdOrKey)` → understand context
2. `addCommentToJiraIssue(cloudId, issueIdOrKey, commentBody)` → add documentation

### Workflow 3: Search Related Documentation
1. `searchConfluenceUsingCql(cloudId, cql: "text ~ 'keyword' AND space = CD")` → find pages
2. `getConfluencePage(cloudId, pageId)` → read full content

---

## Best Practices

1. **Always get cloud ID first** - use `getAccessibleAtlassianResources()` or site URL as fallback
2. **Read before update** - Confluence requires full page body replacement
3. **Markdown format** - all Confluence and Jira content must be Markdown
4. **Full Jira URLs** in release notes: `https://global-e.atlassian.net/browse/CORE-XXXXX`
5. **Handle pagination** - use `limit` + `cursor`/`nextPageToken` for large results

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Cloud ID not found | Call `getAccessibleAtlassianResources()` or use `"https://global-e.atlassian.net"` |
| Page not found (404) | Verify page ID from URL; check if archived; verify permissions |
| Update failed - body required | Read page first, send complete Markdown body |
| Invalid issue type | Call `getJiraProjectIssueTypesMetadata()` for exact type names |
| Transition not available | Call `getTransitionsForJiraIssue()` first; check required fields |

---

## Quick Reference

| Category | Tool | Purpose |
|----------|------|---------|
| **Confluence** | `getConfluencePage()` | Read page |
| | `updateConfluencePage()` | Update page (full body) |
| | `createConfluencePage()` | Create page |
| | `searchConfluenceUsingCql()` | Search content |
| **Jira** | `getJiraIssue()` | Read issue |
| | `searchJiraIssuesUsingJql()` | Search issues |
| | `addCommentToJiraIssue()` | Add comment |
| | `editJiraIssue()` | Update issue |
| **Discovery** | `getAccessibleAtlassianResources()` | Get cloud IDs |
| | `getConfluenceSpaces()` | List spaces |
| | `getVisibleJiraProjects()` | List projects |
