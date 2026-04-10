# STP Generation Examples and Troubleshooting

This file contains example workflows, common patterns, troubleshooting guides, and key success factors for STP generation. See [SKILL.md](SKILL.md) for the main workflow.

**📌 Content Organization:** This file contains usage examples and patterns. For content organization guidelines, see [README.md](README.md).

## Table of Contents

- [Example Workflow](#example-workflow) - Complete example of STP generation from user request to output
- [Bulk Operations](#bulk-operations) - Handling Epics with multiple stories
- [Key Success Factors](#key-success-factors) - Critical factors for successful STP generation
- [Common Patterns](#common-patterns) - Epic vs Story handling, test scenario extraction, risk assessment
- [Common Patterns - Usage](#common-patterns-1) - Feature toggle testing, integration testing, regression testing

**Note:** For detailed troubleshooting procedures, see [REFERENCE.md](REFERENCE.md#troubleshooting-procedures).

---

## Example Workflow

### User Request
"I need to create an STP for CORE-162906"

### AI Response Flow

1. **Fetch Jira epic** (Step 1): Extract title, description, acceptance criteria, Physical Design link, sprint, priority
2. **Check for existing STP** (Step 2): Search Confluence and local files. If found, STOP and ask user (Create New/Update/View/Cancel)
   - **Display format for Confluence STP:** `[Page Title](URL) - Author: [Name] - Created: [Date] / Updated: [Date]`
   - **Example:** `[CORE-160634 - Automating Reconciliation...](https://global-e.atlassian.net/wiki/spaces/CD/pages/6317244576/...) - Author: Denis Hural - Created: Sep 25, 2025 / Updated: Oct 06, 2025`
3. **Extract team members from Jira** (Step 3): Extract from Jira fields FIRST, before Physical Design. See [REFERENCE.md](REFERENCE.md#-team-member-extraction)
4. **Extract Physical Design links** (Step 4): Search BOTH Jira links AND Confluence. If not found, STOP and ask user
5. **Fetch Physical Design** (Step 5): Fetch automatically if page ID found. Inform user with clickable link: `[Page Title](https://global-e.atlassian.net/wiki[webui_path])`
6. **Fetch Related Documents** (Step 6): Check for other Confluence links
7. **Ask questions** (Step 7): Only for missing/unclear information
8. **Fetch Comments and Detect Conflicts** (Step 8): Compare timestamps, prioritize comments if newer, surface conflicts to user
9. **Detect Epic vs Story** (Step 9): If Epic, validate scope. See [REFERENCE.md](REFERENCE.md#-epic-scope-validation)
10. **Pre-Generation Validation** (Step 10): Verify all required information present
11. **Analyze all sources** (Step 11): Extract requirements, test scenarios, technical details, validate Epic scope
12. **Generate Test Scenarios** (Step 12): Extract unit/integration/functional/regression tests, organize into logical sections
13. **Generate STP document** (Step 13): Complete STP with all sections, icons, Document Metadata (skill version, generation date, AI model name)
14. **Quality Pre-Flight Checks** (Step 14): Validate content, formatting, links, accuracy
15. **Generate Summary Report** (Step 15): Use exact template from [TEMPLATES.md](TEMPLATES.md#summary-report-template)
16. **Offer Confluence creation** (Step 16): Show summary, ask if user wants to create in Confluence

### Example: Existing STP Found

**User Request:** "Create STP for CORE-160634"

**AI Response:**
```
Found existing STP page:
- [CORE-160634 - Automating Reconciliation of Prepaid Return Shipping Costs for WYOL Carriers](https://global-e.atlassian.net/wiki/spaces/CD/pages/6317244576/CORE-160634+-+Automating+Reconciliation+of+Prepaid+Return+Shipping+Costs+for+WYOL+Carriers+SKIMS+Bleckmen) - Author: Denis Hural - Created: Sep 25, 2025 / Updated: Oct 06, 2025

Found local files:
- STP_CORE-160634.md
- STP_CORE-160634_v1.md

What would you like to do?
a) Create a new STP (will use versioned filename STP_CORE-160634_v2.md)
b) Update existing STP in Confluence
c) View existing STP content
d) Cancel
```

### Example: Epic with Multiple Stories

**User Request:** "I need to create STPs for Epic CORE-162906"

**AI Response Flow:**
1. Fetch Epic, detect type, query child stories (found 5)
2. Filter automation test stories (CORE-162910 filtered out), remaining: 4 stories
3. Ask user preference: (a) Consolidated STP, (b) Separate STPs, (c) Selective STPs
4. Process according to user choice, provide summary with links

---

## Bulk Operations

**Epic with Multiple Stories - Options:**
- **Consolidated STP**: One STP covering all stories, aggregate test scenarios, include dependencies
- **Separate STPs**: Process each story individually, create separate STP per story, link to parent Epic
- **Selective STPs**: Ask user which stories to include, generate only for selected stories

**Bulk Processing Workflow:**
1. Identify Epic and Stories: Fetch Epic, query child stories, filter automation test stories, list remaining to user
2. User Selection: Ask preference (Consolidated/Separate/Selective)
3. Bulk Generation: Run full STP workflow for each story (or consolidated), apply validation and quality checks
4. Bulk Creation: Offer to create all STPs in Confluence, create in batch, provide summary with links

**Summary:** Provide total STPs generated, STPs created successfully, STPs needing attention, links to all created pages

---

**Note:** For detailed information extraction patterns, conflict detection procedures, and resolution rules, see [REFERENCE.md](REFERENCE.md#information-extraction-patterns) and [REFERENCE.md](REFERENCE.md#conflict-detection-and-resolution).

---

## Key Success Factors

**API & Error Handling:** Implement retry logic (3 attempts, exponential backoff) for critical API calls. If 401 error occurs, STOP immediately and inform user with clear action steps.

**Workflow Execution:** Fetch Jira epic/story immediately when key provided. Check for existing STP (Confluence and local) before generating - never modify without user permission. If existing STP found, STOP and ask user what to do.

**Epic Handling:** Detect Epic vs Story automatically. For Epics: validate scope (filter stories from other epics, exclude Initiative-level E2E flows), filter automation test stories, check Initiative STPs only if no Epic-level Physical Design found.

**Information Extraction:** Extract team members from Jira fields FIRST (not from Physical Design). Extract Physical Design links from BOTH Jira and Confluence. Physical Design is critical - fetch with retry logic, if fails STOP and notify user.

**Conflict Resolution:** Check for conflicts between sources, compare timestamps, prioritize most recent information (comments > documents), surface conflicts to user.

**Validation & Quality:** Run pre-generation validation (don't proceed if critical info missing), run quality pre-flight checks before Confluence creation, use exact Summary Report template format.

**Test Scenario Generation:** Extract unit/integration/functional/regression tests intelligently from all sources. Physical Design is key source for technical test scenarios.

**Best Practices:** Minimize questions (only ask for truly missing/unclear info), confirm extracted info with user, comprehensive source analysis, template compliance, proper formatting, complete coverage, clear responsibilities, risk identification, bulk operations support

---

## Common Patterns

### Epic vs Story Handling
**Epic:** Multiple child stories, broader scope, may require consolidated/separate STPs, higher complexity. **Story:** Single focused feature, specific acceptance criteria, part of Epic. **Strategy:** For Epics - ask user preference (consolidated/separate/selective). For Stories - create focused STP, reference parent Epic if applicable.

### Test Scenario Extraction
**From Jira Story:** Acceptance criteria → 1-2 test scenarios (positive + negative), user story points → test cases, edge cases → negative tests, business rules → business logic tests  
**From Physical Design:** Integration points → integration tests, API endpoints → API tests, data flows → E2E tests, functions/methods → unit test areas, configuration options → configuration tests  
**Classification:** Unit (code-level details, validation logic), Integration (API contracts, service interactions), Functional (user flows, acceptance criteria), Regression (modified components, dependencies)

### Risk Assessment
Common risks: Integration complexity, data dependencies, performance concerns, security implications, timeline constraints

### Feature Toggle Testing
If feature uses toggle: Create toggle validation section, test enabled/disabled states, test at different levels (global, merchant, etc.)

### Integration Testing
If feature integrates with external systems: Create integration test scenarios, include API payload validation, test error handling and edge cases

### Regression Testing
If feature affects existing functionality: List affected areas, reference existing test suites, identify critical regression scenarios

---

**Note:** For detailed troubleshooting procedures, see [REFERENCE.md](REFERENCE.md#troubleshooting-procedures).
