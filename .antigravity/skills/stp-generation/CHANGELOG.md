# Changelog

All notable changes to the STP Generation Skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.10.0] - 2026-02-06

### Added
- Early Epic/Story detection (Step 1a) and child story fetching (Step 1b) to optimize workflow
- Comments included in Step 1 Jira fetch with `expand=comments` parameter to reduce API calls
- Execution analysis documentation for tracking optimizations

### Changed
- Optimized search strategies with early stopping logic to prevent unnecessary API calls
- Updated workflow diagram to include Step 1a and Step 1b
- Modified workflow steps to use cached data from Step 1 (Steps 4a, 6, 8, 9)
- Standardized STP display format for existing Confluence STPs (clickable page name, author, dates)

### Fixed
- CQL query syntax: Changed from multiple `title ~` conditions to single condition with manual filtering (prevents 400 Bad Request errors)
- Redundant API calls and late Epic detection
- Inline comments tool graceful fallback (added note for unavailable tool)

### Performance
- 33-50% reduction in API calls (6 → 4-5 calls)
- 30-40% faster execution (6-11s → 4-8s)

## [1.9.0] - 2026-02-06

### Added
- Automatic local file versioning to prevent overwriting existing STP files

### Changed
- Enhanced file handling with versioned filenames (`_v1`, `_v2`, etc.)

## [1.8.0] - 2026-02-05

### Changed
- Major refactoring: Reduced SKILL.md from 507 to 287 lines
- Consolidated documentation files and removed duplicates
- Enhanced REFERENCE.md and README.md structure

## [1.7.0] - 2026-02-05

### Added
- Duplicate test scenario detection and removal
- Mandatory workflow enforcement rules
- Workflow diagram and error recovery procedures

### Changed
- Consolidated validation and extraction into reference sections
- Merged workflow steps and optimized flow
- Enhanced duplicate detection with automatic renumbering

### Fixed
- QA Engineer extraction logic
- Inconsistent STP check behavior and summary report format

## [1.6.0] - 2026-02-05

### Added
- Initial comprehensive version with core features

### Changed
- Enhanced Epic scope validation and conflict detection
- Improved Physical Design criticality handling

## [1.4.0] - 2026-01-28

### Added
- Automation test story filtering when processing Epics
- Version metadata and changelog tracking

### Changed
- Updated workflows to include automation test filtering

## [1.3.0] - 2026-01-27

### Added
- Test scenarios with Test Level and Priority columns

### Changed
- Updated test scenario table format with automatic level/priority assignment

## [1.2.0] - 2026-01-27

### Added
- Physical Design document fetching with retry logic (3 attempts, exponential backoff)

### Changed
- Improved Physical Design fetching reliability and error handling

## [1.1.0] - 2026-01-27

### Added
- Quality pre-flight checks before Confluence page creation
- Summary report generation after STP creation
- Bulk operations support (Consolidated/Separate/Selective STPs)

### Changed
- Enhanced workflow with quality gates and bulk processing

## [1.0.0] - 2026-01-27

### Added
- Initial STP generation skill implementation
- Epic and Story detection, conflict resolution
- Test scenario generation and Confluence page creation
- Comprehensive documentation

---

## How to Update This Changelog

**When making changes to SKILL.md:**
1. Update version in SKILL.md frontmatter (MAJOR: breaking changes, MINOR: new features, PATCH: bug fixes)
2. Update last_updated date in SKILL.md frontmatter
3. Add entry to CHANGELOG.md under [Unreleased] section (move to new version with date, categorize changes: Added/Changed/Deprecated/Removed/Fixed/Security, provide clear descriptions)
4. Commit both files together in git
