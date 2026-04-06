---
name: Good First Issue
about: Create an issue suitable for new contributors
title: '[GOOD FIRST ISSUE] '
labels: good first issue, help wanted
assignees: ''

---

## Issue Description

<!-- Brief description of what needs to be done -->

This is a **good first issue** for new contributors! 🎉

## Task Details

**What needs to be done:**
<!-- Describe the task clearly -->

**Why this matters:**
<!-- Explain the benefit/value -->

**Estimated difficulty:**
<!-- Easy / Medium -->

**Estimated time:**
<!-- 30 minutes / 1 hour / 2 hours -->

## Getting Started

1. Fork the repository
2. Create a branch: `git checkout -b fix/your-issue-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit with a clear message
6. Open a Pull Request

## Need Help?

- Read the [Contributing Guide](../CONTRIBUTING.md)
- Check existing similar implementations in the codebase
- Ask questions in the comments

## Examples

### Example: Improve large repository scanning performance

**Current behavior:** The scanner loads all files into memory at once, causing OOM errors on repositories with >10k files.

**Expected behavior:** Implement streaming file processing to handle large repositories efficiently.

**Hints:**
- Look at `src/scanner/fileScanner.ts`
- Consider using async generators
- Add batch processing

---

### Example: Add support for additional test frameworks

**Current behavior:** Only detects Jest, Mocha, and Vitest.

**Expected behavior:** Add detection for:
- PyTest (Python)
- RSpec (Ruby)
- PHPUnit (PHP)
- Go test

**Hints:**
- See `src/utils/testDetection.ts`
- Add patterns to `TEST_PATTERNS` array
- Look for config files (pytest.ini, .rspec, phpunit.xml)

---

### Example: Improve architecture detection heuristics

**Current behavior:** Only detects basic patterns like MVC.

**Expected behavior:** Add detection for:
- Microservices architecture
- Event-driven architecture
- Serverless patterns

**Hints:**
- Look at `src/analyzers/architectureAnalyzer.ts`
- Check for docker-compose.yml patterns
- Look for event broker configurations

---

### Example: Add additional ISO/IEEE rules

**Current behavior:** Basic compliance checking.

**Expected behavior:** Add more specific rule checks for:
- IEEE 829 test documentation requirements
- ISO 25010 maintainability metrics
- ISO 12207 phase verification

**Hints:**
- See `src/standards/` directory
- Research the standards' specific requirements
- Implement checks for missing documentation
