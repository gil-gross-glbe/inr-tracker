# STP Generation Skill - Content Organization Guidelines

**⚠️ CRITICAL: When modifying or adding content, follow these guidelines to maintain proper file organization.**

This file contains guidelines for organizing content across the skill files. For the main workflow and usage instructions, see [SKILL.md](SKILL.md).

## File Structure

- **SKILL.md** - Main skill documentation with workflow steps (keep concise, under 500 lines)
- **REFERENCE.md** - Detailed rules and procedures (Epic scope validation, team extraction, local file versioning, error recovery, API retry logic, conflict detection, troubleshooting)
- **TEMPLATES.md** - Document templates, formatting guidelines, icon reference, quality checks, summary report template
- **EXAMPLES.md** - Example workflows, common patterns, key success factors
- **CHANGELOG.md** - Version history and changes
- **README.md** - This file - content organization guidelines

## Content Organization Guidelines

### SKILL.md - Main Workflow (Keep Concise)

**Belongs:** Workflow steps (1-16) with brief instructions, quick reference card, mandatory workflow enforcement rules, links to detailed documentation, critical checkpoints, quick start guide

**Does NOT belong:** Detailed implementation code/queries, long troubleshooting sections, detailed error handling procedures, complete template examples, multiple code examples, detailed API call examples (move to REFERENCE.md, TEMPLATES.md, EXAMPLES.md)

**Guidelines:** Keep under 500 lines, if section exceeds ~20 lines move details to REFERENCE.md, use links instead of duplicating content, focus on "what to do" not "how to do it in detail"

### REFERENCE.md - Detailed Technical Reference

**Belongs:** Detailed implementation procedures, complete API queries and code examples, technical rules and validation logic, error recovery procedures, retry logic and error handling, conflict detection algorithms, extraction patterns and field mappings, multi-strategy search implementations, detailed troubleshooting guides

**Does NOT belong:** Workflow steps (SKILL.md), document templates (TEMPLATES.md), user-facing examples (EXAMPLES.md)

### TEMPLATES.md - Document Templates and Formatting

**Belongs:** Document structure templates, formatting guidelines, icon reference, quality checklists, summary report templates, markdown formatting rules

**Does NOT belong:** Workflow steps (SKILL.md), implementation details (REFERENCE.md), example workflows (EXAMPLES.md), common usage patterns (EXAMPLES.md)

### EXAMPLES.md - Usage Examples and Patterns

**Belongs:** Example user requests and AI responses, common patterns and use cases, key success factors, bulk operation examples, real-world scenarios

**Does NOT belong:** Technical implementation (REFERENCE.md), templates (TEMPLATES.md), workflow steps (SKILL.md), detailed troubleshooting procedures (REFERENCE.md)

## Decision Tree: Where Does Content Go?

Workflow step/quick instruction → SKILL.md | Template/formatting → TEMPLATES.md | Detailed technical procedure → REFERENCE.md | Example/use case → EXAMPLES.md

## When Adding New Content

**Before adding content, ask:**
1. **Is this a workflow step?** → SKILL.md (brief) + REFERENCE.md (detailed if needed)
2. **Is this a template or format?** → TEMPLATES.md
3. **Is this detailed technical implementation?** → REFERENCE.md
4. **Is this an example or pattern?** → EXAMPLES.md

**Red flags (content is in wrong place):**
- SKILL.md section longer than ~30 lines → Move details to REFERENCE.md
- Same content appears in multiple files → Consolidate, use links
- Code examples in SKILL.md → Move to REFERENCE.md or EXAMPLES.md
- Workflow steps in REFERENCE.md → Move to SKILL.md

## Maintenance Rules

**When modifying files:** Check file length (SKILL.md under 500 lines), check for duplication (use links instead), check organization (ensure content matches file purpose), update links (if moving content), update CHANGELOG.md (document changes)

## Version Management

The skill uses semantic versioning (MAJOR.MINOR.PATCH) tracked in:
- SKILL.md frontmatter (`version` and `last_updated` fields)
- CHANGELOG.md (detailed change history)

### Updating Version

When making changes to SKILL.md:

1. **Update version** in SKILL.md frontmatter:
   ```yaml
   version: 1.X.0  # Increment based on change type
   last_updated: YYYY-MM-DD
   ```

2. **Update CHANGELOG.md**:
   - Move `[Unreleased]` section to new version with date
   - Add categorized changes (Added/Changed/Fixed/etc.)
   - Provide clear descriptions

3. **Commit both files** together in git

### Version Numbering

- **MAJOR** (X.0.0): Breaking changes or major feature additions
- **MINOR** (x.Y.0): New features, enhancements (backward compatible)
- **PATCH** (x.y.Z): Bug fixes, minor improvements
