# STP Generation Reference Guide

This file contains detailed reference information for the STP Generation skill. See [SKILL.md](SKILL.md) for the main workflow.

**📌 Content Organization:** This file contains detailed technical implementation, procedures, and troubleshooting. For content organization guidelines, see [README.md](README.md).

## Table of Contents

- [Epic Scope Validation](#-epic-scope-validation) - Rules for validating Epic scope and filtering stories
- [Team Member Extraction](#-team-member-extraction) - Rules for extracting team members from Jira fields
- [Local File Handling and Versioning](#local-file-handling-and-versioning) - Preventing file overwrites with versioned filenames
- [Confluence STP Search Strategies](#confluence-stp-search-strategies) - Multi-strategy search for existing STPs in Confluence
- [Error Recovery Procedures](#error-recovery-procedures) - Handling user errors and recovery scenarios
- [API Call Retry Logic and Error Handling](#api-call-retry-logic-and-error-handling) - Retry strategies and authentication error handling
- [Conflict Detection and Resolution](#conflict-detection-and-resolution) - Detecting and resolving conflicts between sources
- [Information Extraction Patterns](#information-extraction-patterns) - Patterns for extracting Physical Design links, team members, and timeline
- [Physical Design Search and Extraction](#physical-design-search-and-extraction) - Two-location search strategy for finding Physical Design documents
- [Confluence Page Creation](#confluence-page-creation) - Procedures for creating and updating STP pages in Confluence
- [Troubleshooting Procedures](#troubleshooting-procedures) - Common issues and solutions for STP generation

**When to Reference This File:**
- Need detailed Epic scope validation rules → See [Epic Scope Validation](#-epic-scope-validation)
- Extracting team members from Jira → See [Team Member Extraction](#-team-member-extraction)
- Saving local STP files → See [Local File Handling and Versioning](#local-file-handling-and-versioning)
- Searching for existing STPs in Confluence → See [Confluence STP Search Strategies](#confluence-stp-search-strategies)
- Handling API errors or retries → See [API Call Retry Logic](#api-call-retry-logic-and-error-handling)
- Detecting conflicts between sources → See [Conflict Detection](#conflict-detection-and-resolution)
- User provides wrong information or cancels → See [Error Recovery](#error-recovery-procedures)
- Need extraction patterns for links/timeline → See [Information Extraction Patterns](#information-extraction-patterns)
- Creating or updating Confluence pages → See [Confluence Page Creation](#confluence-page-creation)
- Troubleshooting common issues → See [Troubleshooting Procedures](#troubleshooting-procedures)

---

## 📌 Epic Scope Validation

**⚠️ CRITICAL: This section defines Epic scope validation rules. Reference this section when validating Epic scope throughout the workflow.**

**When to Apply:**
- When creating Epic STPs (not Story STPs)
- During story filtering (Step 9: Detect Epic vs Story Type)
- During test scenario generation (Step 12)
- During pre-generation validation (Step 10)
- During quality checks

**Core Rules:**
1. **Epic-level Physical Design is source of truth:**
   - If Epic-level Physical Design exists → Use it as scope source of truth
   - Extract content only from Epic-relevant sections
   - Skip Initiative-level checks

2. **Story filtering:**
   - Filter out stories that belong to other epics (even in same Initiative)
   - Exclude stories about different epic functionality (e.g., refund stories in outbound flow epic)
   - Check story descriptions and dependencies to identify cross-epic stories

3. **Test scenario filtering:**
   - Exclude test scenarios requiring functionality from other epics
   - Exclude Initiative-level E2E flows that span multiple epics
   - Include only Epic-level test scenarios that can be tested independently

4. **Physical Design scope handling:**
   - **Epic-level Physical Design found:** Use as scope source of truth
   - **Physical Design covers multiple epics:** Extract only Epic-relevant sections
   - **Only Initiative-level Physical Design found:** Extract Epic-specific sections only, still limit to Epic scope
   - **No Physical Design found:** Use Epic description/stories, exclude cross-epic content

**Examples:**
- Creating "Outbound Flow" Epic STP → Exclude refund/return test scenarios (belong to Refund Epic)
- Creating "Rebate Enablement" Epic STP → Exclude tax calculation test scenarios (belong to Tax Epic)
- Creating "Tax Calculation" Epic STP → Exclude rebate identification test scenarios (belong to Enablement Epic)

**Validation Checklist:**
- [ ] Epic-level Physical Design found and used as scope source, OR
- [ ] Verified Epic is not duplicating Initiative-level content
- [ ] Confirmed all included stories belong to this Epic
- [ ] Excluded stories from other epics
- [ ] STP scope is limited to Epic-level functionality only
- [ ] No Initiative-level E2E flows included
- [ ] Physical Design scope matches Epic scope

**See Also:**
- [Team Member Extraction](#-team-member-extraction) - Extract team members before Epic scope validation
- [Troubleshooting: Epic Scope Validation Issues](#epic-scope-validation-issues) - Common scope validation problems

---

## 👥 Team Member Extraction

**Extract team members from Jira Epic/Story fields ONLY, BEFORE fetching Physical Design. Physical Design may contain outdated information - Jira is the source of truth.**

**Extraction Order:**
1. Extract immediately after fetching Jira issue
2. Complete extraction before fetching Physical Design
3. If unclear, ask user before fetching Physical Design

**Field Mapping:**
- **QA Engineer:** Check custom fields ("QA Assignee", "Test Lead", "QA Engineer", "QA") → Initiative STP (if Epic part of Initiative) → Assignee (only if role/email suggests QA) → Reporter (only if role suggests QA) → Ask user (last resort - do not assume assignee is QA)
- **Product Owner:** Check custom fields (Product Owner, PO, Epic Owner), epic owner field, or reporter if PO role
- **Developer/Tech Lead:** Check assignee (if not QA), custom fields (Developer, Tech Lead), or story creator

**Validation:** Before fetching Physical Design, verify QA Engineer, Product Owner, and Developer/Tech Lead extracted from Jira fields.

**Do not extract from Physical Design documents or assume assignee is QA (assignee is typically Developer/Tech Lead).**

**See Also:**
- [Information Extraction Patterns: Team Member Extraction](#team-member-extraction-from-jira-not-from-physical-design) - Detailed extraction steps
- [Epic Scope Validation](#-epic-scope-validation) - Validate Epic scope after team extraction

---

## Local File Handling and Versioning

**⚠️ CRITICAL: This section defines rules for handling local STP files to prevent accidental overwrites.**

**When to Apply:**
- When checking for existing STP files (Step 2)
- When user chooses "Create a new STP" and local files exist
- When saving STP content to local file system

**Core Rules:**

1. **Never Overwrite Existing Files:**
   - **DO NOT** overwrite existing local STP files under any circumstances
   - **ALWAYS** use versioned filenames when local files exist
   - **VERIFY** file doesn't exist before saving

2. **Versioned Filename Logic:**
   - **Base filename format**: `STP_[EPIC-KEY].md` (for first file)
   - **Versioned format**: `STP_[EPIC-KEY]_v[N].md` where [N] is version number (1, 2, 3, etc.)
   - **Determine next version**: 
     - Scan for all files matching `STP*[EPIC-KEY]*.md` pattern
     - Extract version numbers from existing files (e.g., `_v1`, `_v2`, `_v3`)
     - Find highest version number
     - Increment by 1 for new file
   - **Examples**:
     - If `STP_CORE-12345.md` exists → use `STP_CORE-12345_v1.md`
     - If `STP_CORE-12345.md` and `STP_CORE-12345_v1.md` exist → use `STP_CORE-12345_v2.md`
     - If only `STP_CORE-12345_v2.md` exists → use `STP_CORE-12345_v3.md` (or `STP_CORE-12345.md` if no base file)

3. **File Detection Process:**
   - Use `glob_file_search` with pattern: `STP*[EPIC-KEY]*.md`
   - List ALL found files to user in Step 2
   - Parse filenames to extract version numbers
   - Sort versions numerically to find highest

4. **User Choice Handling:**
   - **"Create a new STP"**: Always use versioned filename if local files exist
   - **"Update existing STP"**: Modify the specific file user chooses (don't create new)
   - **"View existing STP"**: Read and display content, don't modify

**Validation Checklist:**
- [ ] Checked for existing files before saving
- [ ] Determined correct version number
- [ ] Verified new filename doesn't conflict with existing files
- [ ] Used versioned filename when local files exist
- [ ] Did NOT overwrite any existing files

**❌ DO NOT:**
- ❌ Overwrite existing local files
- ❌ Assume user wants to replace existing file
- ❌ Use same filename if local files exist
- ❌ Skip version checking

**✅ DO:**
- ✅ Always check for existing files first
- ✅ Use versioned filenames when files exist
- ✅ Increment version number correctly
- ✅ Inform user of chosen filename before saving

---

## Confluence STP Search Strategies

**Multi-strategy search approach for finding existing STPs in Confluence. Always use multiple search strategies to ensure completeness.**

**Tool**: `mcp_atlassian_searchConfluenceUsingCql`

**Required Parameters**:
- `cloudId`: `"97dda470-29da-47e8-b3a8-ee663b322db9"`
- `cql`: CQL query string (see strategies below)
- `limit`: 25 (use 50 for Strategy 3)

**Notes**: Replace `[EPIC-KEY]` with actual epic/story key. CQL uses `~` for case-insensitive matching. Multi-word phrases need quotes: `title ~ "Software Test Plan"`. Check `results` array - empty means 0 results.

### Strategy 1: Primary Search (Most Precise)

**CQL Query:**
```
space = CD AND type = page AND title ~ "[EPIC-KEY]"
```

**Tool Call Example:**
```
mcp_atlassian_searchConfluenceUsingCql({
  cloudId: "97dda470-29da-47e8-b3a8-ee663b322db9",
  cql: "space = CD AND type = page AND title ~ \"CORE-162906\"",
  limit: 25
})
```

**Process:** Execute query, then filter results manually to find pages with "STP" or "Software Test Plan" in title (case-insensitive). Check each page's `title` field. If title contains both epic key and "STP" or "Software Test Plan", include it.

**When to Use:** Start with this query. If results found after filtering, STOP here (no need for remaining strategies). If no STP found after filtering, continue to Strategy 2.

### Strategy 2: Broader Search (Fallback)

**CQL Query:**
```
space = CD AND type = page AND title ~ "[EPIC-KEY]"
```

**Tool Call Example:**
```
mcp_atlassian_searchConfluenceUsingCql({
  cloudId: "97dda470-29da-47e8-b3a8-ee663b322db9",
  cql: "space = CD AND type = page AND title ~ \"CORE-162906\"",
  limit: 25
})
```

**Process:** Execute query, then filter results manually to find pages with "STP" or "Software Test Plan" in title OR text content (case-insensitive). Check each page's `title` and `excerpt` fields.

**When to Use:** Execute only if Strategy 1 found no STP results after filtering. If results found after filtering, STOP here - no need for Strategy 3/4.

### Strategy 3: Epic Key Only (Fallback)

**CQL Query:**
```
space = CD AND type = page AND title ~ "[EPIC-KEY]"
```

**Tool Call Example:**
```
mcp_atlassian_searchConfluenceUsingCql({
  cloudId: "97dda470-29da-47e8-b3a8-ee663b322db9",
  cql: "space = CD AND type = page AND title ~ \"CORE-162906\"",
  limit: 50
})
```

**Process:** Execute query with limit 50, then filter results manually to find pages with "STP" or "Software Test Plan" in title or content. Check each page's `title` field (case-insensitive). If title doesn't contain STP indicators, check `excerpt` field. Only fetch full page content if necessary.

**When to Use:** Execute only if Strategies 1-2 found no STP results after filtering. If results found after filtering, STOP here - no need for Strategy 4.

### Strategy 4: Parent Folder Search (Fallback)

**Tool**: `mcp_atlassian_getConfluencePageDescendants`

**Tool Call Example:**
```
mcp_atlassian_getConfluencePageDescendants({
  cloudId: "97dda470-29da-47e8-b3a8-ee663b322db9",
  pageId: "4555964418",
  limit: 100
})
```

**Process:** Get all descendants of STP parent folder (ID: 4555964418), then filter for pages containing `[EPIC-KEY]` AND "STP" or "Software Test Plan" in title (case-insensitive). Only include pages matching both criteria.

**When to Use:** Execute after Strategy 3 (even if previous strategies found results). Searches within known STP location.

### Execution Rules

**CRITICAL: Execute strategies in order, STOP immediately when STP results found after filtering:**

1. **Strategy 1:** Execute query, filter results for STP pages
   - **If STP found:** STOP immediately - do NOT execute remaining strategies
   - **If no STP found:** Continue to Strategy 2

2. **Strategy 2:** Execute only if Strategy 1 found no STP. Filter results for STP pages
   - **If STP found:** STOP immediately - do NOT execute remaining strategies
   - **If no STP found:** Continue to Strategy 3

3. **Strategy 3:** Execute only if Strategies 1-2 found no STP. Filter results for STP pages
   - **If STP found:** STOP immediately - do NOT execute Strategy 4
   - **If no STP found:** Continue to Strategy 4

4. **Strategy 4:** Execute only if Strategies 1-3 found no STP. Filter results for STP pages

**After execution:** Combine results from all executed strategies, remove duplicates by page ID, report findings.

**Important:** Do NOT execute Strategy 2 if Strategy 1 found STP. Do NOT execute Strategy 3 if Strategy 2 found STP. Do NOT execute Strategy 4 if Strategy 3 found STP.

### Common Issues and Solutions

**Issue: CQL query with multiple `title ~` conditions fails (400 Bad Request)**
- **Cause**: CQL parser doesn't support multiple `title ~` conditions in same query
- **Solution**: Use single `title ~ "[EPIC-KEY]"` condition, then filter results manually for "STP" in title
- **Fixed in v1.10.0:** All strategies now use single condition + manual filtering

**Issue: CQL query returns 0 results but STP exists**
- **Cause**: Query too restrictive, case sensitivity, or formatting mismatch
- **Solution**: Use Strategy 2 (broader search) or Strategy 3 (epic key only)

**Issue: Epic key format mismatch**
- **Cause**: Epic key might be formatted differently (e.g., "CORE-12345" vs "CORE12345")
- **Solution**: Strategy 3 searches by epic key in title only, catches variations

**Issue: STP in different location**
- **Cause**: STP might be in a different folder or space
- **Solution**: Strategy 4 searches the known STP parent folder

**Issue: Title doesn't contain "STP" exactly**
- **Cause**: Title might have "STP" in different case or format
- **Solution**: Strategy 2 searches for "STP" in both title and text content

### Verification Checklist

After executing searches:
- [ ] Strategy 1 executed (even if 0 results)
- [ ] Strategy 2 executed if Strategy 1 returned 0 results
- [ ] Strategy 3 executed if Strategy 2 returned 0 results
- [ ] Strategy 4 executed if Strategy 3 returned 0 results
- [ ] All results combined and duplicates removed
- [ ] Results verified to be actual STP documents
- [ ] User notified with complete findings from all searches

### Error Handling

**If API errors occur:**
- Retry with exponential backoff (see [API Call Retry Logic](#api-call-retry-logic-and-error-handling))
- If authentication fails (401), stop and notify user
- If rate limiting (429), wait and retry
- If all strategies fail due to errors, report: "Unable to complete Confluence search due to API errors. Please verify manually."

**If all strategies return 0 results:**
- Report: "No existing STP found in Confluence after trying multiple search strategies"
- This indicates thorough search was performed
- User can verify manually if needed

### Implementation Workflow

1. Initialize results array
2. Execute Strategy 1: Extract `results` array, add to results
3. Execute Strategy 2: Extract `results` array, add to results
4. Execute Strategy 3: Execute query, filter manually for "STP" or "Software Test Plan", add filtered results
5. Execute Strategy 4: Get descendants of parent folder (ID: 4555964418), filter for epic key AND STP indicators, add filtered results
6. Combine and deduplicate: Remove duplicates by page ID
7. Report findings: Display each found STP in specified format (see below), or report "No existing STP found after trying all 4 strategies"

**Always execute all 4 strategies and combine results - do not skip any strategy even if earlier strategies found results.**

### Display Format for Found STPs

**When STP is found in Confluence, display in this exact format:**

```
Found existing STP page:
- [Page Title](URL) - Author: [Author Name] - Created: [Date] / Updated: [Date]
```

**Data Extraction from Confluence Response:**

From `mcp_atlassian_searchConfluenceUsingCql` response, extract:
- **Page Title:** `results[].title` - Use as-is for display
- **URL:** `results[]._links.webui` or `results[].url` - Use for clickable link
- **Author:** `results[].content.history.createdBy.displayName` or `results[].content.history.createdBy.publicName` - Use display name
- **Created Date:** `results[].content.history.createdDate` - Format from ISO 8601 to readable (e.g., "Sep 25, 2025")
- **Updated Date:** `results[].lastModified` or `results[].friendlyLastModified` - Format from ISO 8601 to readable (e.g., "Oct 06, 2025")

**Date Formatting:**
- Convert ISO 8601 format (`2025-09-25T11:14:44.150Z`) to readable format (`Sep 25, 2025`)
- Use `friendlyLastModified` if available (already formatted, e.g., "Oct 06, 2025")
- If date unavailable, show "Unknown"

**Example Output:**

```
Found existing STP page:
- [CORE-160634 - Automating Reconciliation of Prepaid Return Shipping Costs for WYOL Carriers](https://global-e.atlassian.net/wiki/spaces/CD/pages/6317244576/CORE-160634+-+Automating+Reconciliation+of+Prepaid+Return+Shipping+Costs+for+WYOL+Carriers+SKIMS+Bleckmen) - Author: Denis Hural - Created: Sep 25, 2025 / Updated: Oct 06, 2025
```

**Handling Missing Fields:**
- If author unavailable: Skip "Author:" field or show "Author: Unknown"
- If created date unavailable: Show only updated date
- If updated date unavailable: Show only created date
- If both dates unavailable: Skip date fields

---

## Error Recovery Procedures

### User Provides Wrong Epic/Story Key
**Detection:** API returns 404 or issue doesn't match expected type  
**Recovery:** Inform user, ask to verify key, offer to search for similar keys, restart workflow with correct key

### User Cancels Mid-Process
**Recovery:** Acknowledge cancellation, optionally save extracted information, offer to resume, clean up partial files

### User Provides Incorrect Information
**Detection:** Physical Design fetch fails (404, 403), team member doesn't exist, information doesn't match context  
**Recovery:** Validate when provided, if invalid inform user and offer alternatives, if user corrects update and continue, if skips note limitation in STP

### User Wants to Restart from Specific Step
**Recovery:** Acknowledge request, skip completed steps, resume from requested step (validate dependencies)

### User Wants to Undo Confluence Page Creation
**Recovery:** Offer delete/update/revert options, confirm action, execute after confirmation

### Partial Data Scenarios
**Recovery:** Critical missing (Physical Design, Epic/Story) - cannot proceed. Optional missing (team members, timeline) - proceed with placeholders, note limitations

### API Rate Limiting
**Detection:** 429 Too Many Requests error  
**Recovery:** Implement exponential backoff (2s, 4s, 8s), inform user, if persists offer to save progress and resume later

---

## API Call Retry Logic and Error Handling

**CRITICAL: All critical API calls must implement retry logic with authentication error handling.**

**Retry Strategy for All API Calls:**
1. **First Attempt**: Immediate API call
2. **Retry Attempts**: Up to 2 additional attempts (total 3 attempts) with exponential backoff delays:
   - Attempt 2: Wait 2 seconds, then retry
   - Attempt 3: Wait 4 seconds, then retry
3. **Error Types to Handle:**
   - **401 Unauthorized** (Authentication failed) - CRITICAL: Stop and inform user
   - 400 Bad Request (invalid parameters)
   - 403 Forbidden (access denied)
   - 404 Not Found (resource doesn't exist)
   - 429 Too Many Requests (rate limiting)
   - Network/timeout errors

**Authentication Error Handling (401 Unauthorized):**
- **If 401 error occurs on ANY attempt**: 
  - **STOP STP Generation immediately**
  - **DO NOT proceed with remaining API calls**
  - **Inform user with clear action steps:**

```
⚠️ CRITICAL: Authentication Failed

I encountered an authentication error (401 Unauthorized) while trying to fetch information from Atlassian:

- Failed Operation: [Operation name, e.g., "Fetching child stories", "Searching Confluence"]
- Error: Authentication failed - Unauthorized

**What this means:**
The Atlassian MCP connection has lost authentication or the credentials have expired.

**Actions you can take:**
1. **Re-authenticate**: Refresh your Atlassian credentials/token in the MCP server configuration
2. **Check MCP Server Status**: Verify the Atlassian MCP server is running and properly configured
3. **Verify Permissions**: Ensure your Atlassian account has necessary permissions for Jira and Confluence access
4. **Retry After Fix**: Once authentication is restored, I can retry fetching the missing information

**Current Status:**
- ✅ Epic/Story basic information: [Status - fetched/not fetched]
- ❌ Child stories: Not fetched (authentication failed)
- ❌ Physical Design: Not fetched (authentication failed)
- ❌ Confluence search: Not fetched (authentication failed)

**Options:**
a) Proceed with STP generation using available information only (may be incomplete)
b) Wait for you to fix authentication, then retry fetching missing information
c) Cancel STP generation

Please let me know how you'd like to proceed.
```

**Non-Critical API Call Failures:**
- If a non-critical API call fails after retries (e.g., searching for related documents):
  - Log the failure
  - Inform user: "⚠️ Unable to fetch [resource] after 3 attempts. Proceeding with available information."
  - Continue STP generation with available data

---

## Conflict Detection and Resolution

### When to Check for Conflicts

Always compare information from multiple sources when:
- Story description contains specific conditions or requirements
- Physical Design document has implementation details
- Comments exist (especially recent ones)
- Multiple versions of requirements are present

### Conflict Detection Patterns

**Look for conflicts in:** Business Logic, Configuration, Acceptance Criteria, Technical Implementation, Edge Cases, Dependencies

**Examples:**
- Feature Toggle: Physical Design says "merchant level" → Comment (newer) says "global level" → Use global level
- API Endpoint: Story says "/api/v1" → Comment (newer) says "/api/v2" → Use v2 endpoint
- Test Scope: Physical Design says "all payment methods" → Comment (newer) says "credit cards only" → Use credit cards only

### Timestamp Extraction

**From Jira:**
- Story last updated: `fields.updated` or `fields.created`
- Comment timestamps: `comment.created` or `comment.updated`
- Compare ISO 8601 timestamps

**From Confluence:**
- Page last modified: `version.when` or `version.by`
- Comment timestamps: `createdAt` or `updatedAt`
- Compare ISO 8601 timestamps

**Timestamp Comparison:** Compare ISO 8601 timestamps. If comment timestamp > Physical Design timestamp, use comment info. If Physical Design timestamp > comment timestamp, use Physical Design info. If same/unclear, default to comment priority.

### User Notification Format

```
⚠️ CONFLICT DETECTED AND RESOLVED:

I found conflicting information about [specific topic/condition]:

📄 Original Source ([source type], dated [date]): [Original information]
💬 Updated Source ([comment/update], dated [newer date]): [Updated information]

✅ Resolution: Using the updated information from [source] since it's more recent.

Please verify this is correct. If the original information should be used instead, let me know and I'll update the STP.
```

### Conflict Resolution Priority Rules

1. Most Recent Timestamp Wins - prioritize newer information
2. Comments Over Documents - comments often contain recent decisions
3. Explicit Over Implicit - clear statements override ambiguous ones
4. User Verification - always surface conflicts for user confirmation
5. Consistency - apply resolved conflicts consistently throughout STP

### Handling Multiple Conflicts

List each conflict separately, resolve independently based on timestamps, provide summary, allow user to verify all resolutions.

---

## Information Extraction Patterns

## Physical Design Search and Extraction

**⚠️ CRITICAL: Physical Design document is ESSENTIAL. You MUST search in BOTH locations (Jira links AND Confluence) before concluding it doesn't exist. If not found, STOP and ask user for options (provide link OR proceed without Physical Design).**

**When to Apply:**
- During Step 4: Extract Physical Design Links and Timeline from Jira
- When Physical Design link is not found in Jira story description/comments
- Before proceeding to Step 5 (Fetch Physical Design)

**Search Strategy: Two-Location Search (MANDATORY)**

### Location 1: Search Jira Story/Epic (FIRST)

### Physical Design Link Patterns to Search For:
- Confluence URLs: `https://global-e.atlassian.net/wiki/spaces/.../pages/[PAGE-ID]/...`
- Short links: `[Physical Design|https://global-e.atlassian.net/wiki/.../pages/[PAGE-ID]]`
- Page ID patterns: Numbers after `/pages/` in URLs
- Text patterns: "Physical Design:", "PD:", "Design Doc:", etc.
- Search in: Story description, story comments, linked issues

**Extraction Process (Jira):**
1. Use comments already fetched in Step 1 (with expand=comments) - no additional API call needed
2. Parse story description HTML/text (from Step 1) for Confluence links
3. Parse all story comments (from Step 1) for Confluence links
4. Extract page ID (number after `/pages/` in URL)
5. If multiple links found, prioritize ones with "Physical Design", "PD", "Design" in link text
6. If found: Note page ID and proceed to Step 5
7. If NOT found: Continue to Location 2 (Confluence search)

### Location 2: Search Confluence (SECOND - if not found in Jira)

**⚠️ CRITICAL: If Physical Design was not found in Jira, you MUST search Confluence before concluding it doesn't exist.**

**Tool**: `mcp_atlassian_searchConfluenceUsingCql`

**Required Parameters**:
- `cloudId`: `"97dda470-29da-47e8-b3a8-ee663b322db9"` (Global-E Confluence Cloud ID)
- `cql`: CQL query string (see below)
- `limit`: 25

**CQL Query:**
```
space = CD AND type = page AND title ~ "Physical Design" AND text ~ [EPIC-KEY]
```

**Alternative queries if above doesn't work:**
```
space = CD AND type = page AND title ~ Physical AND text ~ [EPIC-KEY]
space = CD AND type = page AND title ~ PD AND text ~ [EPIC-KEY]
```

**Tool Call Example:**
```
mcp_atlassian_searchConfluenceUsingCql({
  cloudId: "97dda470-29da-47e8-b3a8-ee663b322db9",
  cql: "space = CD AND type = page AND title ~ \"Physical Design\" AND text ~ CORE-162906",
  limit: 25
})
```

**Important Notes:**
- Replace `[EPIC-KEY]` with actual epic/story key (e.g., "CORE-162906")
- Multi-word phrases need quotes: `title ~ "Physical Design"`
- Single words don't need quotes: `title ~ Design` or `title ~ PD`
- Check tool response for `results` array - empty array means 0 results

**After Confluence Search:**
- If found: Extract page ID from results, proceed to Step 5
- If NOT found in BOTH locations: **STOP IMMEDIATELY - DO NOT proceed to Step 5, Step 6, or any later steps. Go directly to Step 7 to ask user for options (provide link OR proceed without Physical Design).**

**Complete Extraction Process:**
1. Search Jira story description/comments for Confluence links
2. If found in Jira: Extract page ID, proceed to Step 5
3. If NOT found in Jira: **MANDATORY** - Search Confluence using CQL query above (DO NOT skip this step)
4. If found in Confluence: Extract page ID from results, proceed to Step 5
5. **⚠️ CRITICAL STOP CONDITION**: If NOT found in BOTH locations: **STOP IMMEDIATELY. DO NOT proceed to Step 5, Step 6, or any later steps. Go directly to Step 7 to ask user for options (provide link OR proceed without Physical Design).**
6. Once page ID is available: Fetch the page automatically in Step 5
7. Inform user: "Found physical design: [Page Title](https://global-e.atlassian.net/wiki[webui_path]) (Author: [Author Name], Last Modified: [date]). Using this for STP generation."

**Checkpoint:** Before Step 5, verify Physical Design page ID exists. If YES, proceed to Step 5. If NO, STOP and go to Step 7 to ask user for options.

### Timeline Extraction from Jira

**Sprint:** Extract from "Sprint" field, look for sprint names in description ("Sprint 45", "Sprint-45"), check linked sprint information  
**Fix Version/Target Version:** Extract from "Fix Version" or "Target Version" field, look for version names in description  
**Due Date:** Extract from "Due Date" field, look for dates in description or comments  
**Timeline text:** Parse description/comments for dates, sprint names, release names

**If found:** Use directly in STP Schedule section, inform user. **If missing:** Ask user for sprint/timeline information.

---

## Confluence Page Creation

**This section covers procedures for creating and updating STP pages in Confluence.**

After generating the STP content, offer to create the Confluence page:

### Page Details
- **Space**: CD (Core R&D)
- **Parent Folder**: Use existing STP folder (typically page ID: 4555964418 or similar)
- **Title Format**: `STP - [EPIC-KEY] - [Epic Title]`
- **Content Format**: Storage format (HTML/markdown converted)

### Creation Process

**IMPORTANT: This check should have already been done earlier in the workflow (Step 2: Check for Existing STP). If an existing STP was found, the user should have already chosen what to do.**

1. **Verify no existing STP** (should already be checked, but double-check if creating new):
   - If creating new: Confirm user chose "Create New STP" option
   - If updating: Confirm user chose "Update Existing STP" option and has approved changes

2. **Get parent folder**: Use `getConfluencePageDescendants` to find STP folder structure

3. **Create or Update page**:
   
   **For New STP:**
   - Use `createConfluencePage` with:
     - Space key: "CD"
     - Parent page ID: [STP folder ID]
     - Title: `STP - [EPIC-KEY] - [Epic Title]`
     - Body: Generated STP content in storage format
   
   **For Updating Existing STP:**
   - Use `updateConfluencePage` with:
     - Page ID: [Existing page ID]
     - Title: `STP - [EPIC-KEY] - [Epic Title]` (or keep existing)
     - Body: Updated STP content in storage format
     - Version: Increment version number

4. **Verify creation/update**: Confirm page was created/updated and provide URL

---

## Troubleshooting Procedures

**This section covers common issues and solutions encountered during STP generation.**

### Physical Design Fetch Failures

**Common Issues:**
- **400 Bad Request:** Page ID might be short link format → Search Confluence using CQL, extract numeric ID from URL, or ask user for correct numeric ID
- **404 Not Found:** Page doesn't exist or was deleted → Search for alternative design documents, check if moved/renamed, ask user for updated page ID
- **403 Forbidden:** Insufficient permissions → Notify user, ask to verify permissions or provide alternative access
- **429 Too Many Requests:** Rate limiting → Wait between retries, implement exponential backoff (1s, 2s, 4s delays)
- **Network/Timeout Errors:** Connectivity issues → Retry with longer timeout, check network, try alternative methods

**Retry Strategy:** Attempt 1 (immediate) → Attempt 2 (wait 2s) → Attempt 3 (wait 4s, try alternative method). If all retries fail: STOP STP generation, notify user immediately, provide actionable steps, wait for user confirmation.

### Missing Information
Ask user for clarification, check related Jira issues, look for similar STPs as reference, use Naboo search for internal documentation

### Confluence Access Issues
Verify cloud ID: `97dda470-29da-47e8-b3a8-ee663b322db9`, check MCP tool availability, confirm page IDs are correct (extract from URL). If page ID is short link format, search Confluence instead of direct fetch

### Conflict Resolution Issues
Unclear timestamps: default to comment priority. Multiple conflicting comments: use most recent. Ambiguous conflicts: ask user for clarification. User correction: update STP immediately with correct information

### Bulk Operations Issues
Epic detection fails: check issue type field and linked issues. Story query fails: try alternative Jira queries or ask user for story list. Large Epics (10+ stories): process in batches, provide progress updates. Consolidated STP too large: suggest separate STPs

### Existing STP Detection Issues
Confluence search fails: check local filesystem only and inform user. Multiple STPs found: list ALL and ask user which to use. STP title variations: search for "STP - [KEY]", "STP_[KEY]", "STP [KEY]". User doesn't respond: wait for explicit choice

### Epic Scope Validation Issues
Epic-level Physical Design found: use as scope source of truth, extract Epic-relevant sections only. No Epic-level Physical Design: check Initiative for context but limit to Epic scope. Cross-Epic stories: exclude and inform user. Scope overlap: verify Epic-specific, exclude or note in "Out of Scope". Physical Design scope: Epic-level → use as source of truth; covers multiple epics → extract only THIS Epic sections; different epic → search for correct Epic-level; only Initiative → extract Epic-specific sections only

### Validation Failures
Missing information: list what's missing and ask user to provide. Test scenario generation: ask user to clarify acceptance criteria. Quality check failures: fix formatting automatically, ask user for clarification on content issues
