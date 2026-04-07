# MCP Git Auditor

[![npm version](https://img.shields.io/npm/v/mcp-git-auditor.svg)](https://www.npmjs.com/package/mcp-git-auditor)
[![License](https://img.shields.io/npm/l/mcp-git-auditor.svg)](https://github.com/Mosipro1/mcp-git-auditor/blob/main/LICENSE)
[![Build Status](https://github.com/Mosipro1/mcp-git-auditor/actions/workflows/ci.yml/badge.svg)](https://github.com/Mosipro1/mcp-git-auditor/actions)
[![Downloads](https://img.shields.io/npm/dm/mcp-git-auditor.svg)](https://www.npmjs.com/package/mcp-git-auditor)
[![GitHub stars](https://img.shields.io/github/stars/Mosipro1/mcp-git-auditor.svg)](https://github.com/Mosipro1/mcp-git-auditor/stargazers)

An MCP (Model Context Protocol) server that audits Git repositories against software engineering standards and quality practices. Built in TypeScript for Node.js.

```bash
# Install globally
npm install -g mcp-git-auditor

# Configure in Claude Desktop and start auditing!
```

## Overview

MCP Git Auditor performs automated audits of Git repositories, evaluating:

- **Architecture Quality**: Detects patterns like MVC, Clean Architecture, Hexagonal Architecture, DDD
- **Documentation Completeness**: Checks for README, SRS, architecture, design, and test documentation
- **Testing Practices**: Identifies test frameworks and evaluates coverage
- **Security Issues**: Detects hardcoded secrets, exposed credentials, unsafe code patterns
- **Software Engineering Standards**: Evaluates compliance with IEEE 829, IEEE 830, ISO/IEC 25010, ISO/IEC 12207

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [MCP Configuration](#mcp-configuration)
- [Example Usage](#example-usage)
- [Supported Standards](#supported-standards)
- [Project Structure](#project-structure)
- [Scoring Weights](#scoring-weights)
- [Standards Evaluated](#standards-evaluated)
- [Security Checks](#security-checks)
- [Development](#development)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

## Features

- **Repository Scanning**: Recursively scans directories, ignoring common build artifacts
- **Documentation Analysis**: Detects README, SRS, architecture, design, and test documentation
- **Test Analysis**: Identifies test frameworks (Jest, Vitest, Mocha, PyTest, etc.) and test artifacts
- **Architecture Detection**: Detects patterns like MVC, Clean Architecture, Hexagonal Architecture, DDD
- **Security Scanning**: Detects hardcoded secrets, exposed credentials, unsafe code patterns
- **Standards Evaluation**: Evaluates compliance with IEEE 829, IEEE 830, ISO/IEC 25010, ISO/IEC 12207
- **Git Analysis**: Analyzes commit history, commit message quality, branch patterns

## Why MCP Git Auditor?

| Feature | MCP Git Auditor | SonarQube | CodeClimate | Semgrep |
|---------|-----------------|-----------|-------------|---------|
| MCP Server Integration | ✅ | ❌ | ❌ | ❌ |
| IEEE/ISO Standards | ✅ | Partial | ❌ | ❌ |
| Architecture Detection | ✅ | ❌ | ❌ | ❌ |
| Git Hygiene Analysis | ✅ | ❌ | ❌ | ❌ |
| Free & Open Source | ✅ | Limited | Limited | ✅ |
| No External Dependencies | ✅ | ❌ | ❌ | ❌ |

## Quick Start

### One-Line Install

```bash
npm install -g mcp-git-auditor
```

### MCP Configuration (Claude Desktop)

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "git-auditor": {
      "command": "npx",
      "args": ["-y", "mcp-git-auditor"]
    }
  }
}
```

### Usage

Once configured, ask Claude:
- "Audit this repository"
- "Check code quality of /path/to/repo"
- "Analyze testing practices in this project"

### Alternative: Run Standalone

```bash
# Using npx (no install required)
npx mcp-git-auditor

# Or if installed globally
mcp-git-auditor
```

## Installation

### Prerequisites

- Node.js 18+
- Git 2.30+

### Global Install

```bash
npm install -g mcp-git-auditor
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/Mosipro1/mcp-git-auditor.git
cd mcp-git-auditor

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

## MCP Configuration

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "git-auditor": {
      "command": "node",
      "args": [
        "/path/to/mcp-git-auditor/dist/server.js"
      ],
      "env": {
        "MAX_FILE_SIZE": "10485760",
        "SCAN_TIMEOUT_MS": "300000",
        "LOG_LEVEL": "info",
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Gemini / Google AI Studio Configuration

Add to your `gemini_config.json`:

```json
{
  "mcpServers": {
    "git-auditor": {
      "command": "node",
      "args": [
        "/path/to/mcp-git-auditor/dist/server.js"
      ],
      "env": {
        "MAX_FILE_SIZE": "10485760",
        "SCAN_TIMEOUT_MS": "300000",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
# Edit .env with your preferred settings
```

## Example Usage

### Calling the Tool

The server exposes one main tool: `audit_repository`

```typescript
// Example MCP tool call
const result = await callTool("audit_repository", {
  path: "./my-repo"
});
```

### Expected Results

```json
{
  "repository": "my-repo",
  "scanDate": "2024-01-15T10:30:00.000Z",
  "fileCount": 150,
  "sourceFileCount": 80,
  "testFileCount": 25,
  "documentationFileCount": 12,
  "summary": {
    "overallScore": 72,
    "riskLevel": "medium",
    "keyStrengths": ["Good documentation coverage", "No security issues detected"],
    "keyWeaknesses": ["Inadequate test coverage", "Low standards compliance"],
    "recommendations": ["Implement automated tests", "Add test documentation"]
  },
  "git": {
    "commitCount": 45,
    "branchCount": 3,
    "commitQuality": { "score": 75, "findings": [] }
  },
  "documentation": {
    "score": 65,
    "findings": [...],
    "artifacts": ["README.md", "docs/SRS.md"]
  },
  "tests": {
    "score": 40,
    "frameworkDetected": "jest",
    "findings": [...],
    "artifacts": ["tests/unit/main.test.ts"]
  },
  "architecture": {
    "detectedPattern": "Clean Architecture",
    "modularityScore": 72,
    "findings": []
  },
  "standards": {
    "IEEE829": { "compliant": false, "score": 45, "findings": [], "missing": [...], "recommendations": [] },
    "IEEE830": { "compliant": true, "score": 60, "findings": [], "missing": [...], "recommendations": [] },
    "ISO25010": { "compliant": true, "score": 68, "findings": [], "missing": [...], "recommendations": [] },
    "ISO12207": { "compliant": false, "score": 52, "findings": [], "missing": [...], "recommendations": [] }
  },
  "security": {
    "score": 95,
    "findings": [],
    "secretsDetected": false
  },
  "files": {
    "byType": { "typescript": 60, "javascript": 20, "markdown": 10, "json": 8 },
    "ignored": ["node_modules", ".git", "dist"],
    "scanned": [...]
  },
  "errors": []
}
```

## Project Structure

```
mcp-git-auditor/
├── src/
│   ├── server.ts                    # MCP server entry point
│   ├── types/
│   │   └── auditTypes.ts            # TypeScript type definitions
│   ├── analyzers/
│   │   ├── architectureAnalyzer.ts # Architecture pattern detection
│   │   ├── codeQualityAnalyzer.ts   # Code quality evaluation
│   │   ├── documentationAnalyzer.ts # Documentation analysis
│   │   ├── securityAnalyzer.ts      # Security issue detection
│   │   └── testAnalyzer.ts          # Test framework detection
│   ├── engine/
│   │   ├── complianceEngine.ts    # Standards compliance evaluation
│   │   └── scoringEngine.ts        # Score calculation
│   ├── scanner/
│   │   ├── fileScanner.ts          # File system scanning
│   │   ├── gitScanner.ts           # Git metadata scanning
│   │   ├── ignoreRules.ts          # Path ignore patterns
│   │   └── repoScanner.ts          # Repository scanning orchestration
│   ├── report/
│   │   └── reportGenerator.ts      # Audit report generation
│   ├── standards/
│   │   ├── ieee829.ts              # IEEE 829 compliance
│   │   ├── ieee830.ts              # IEEE 830 compliance
│   │   ├── iso12207.ts             # ISO/IEC 12207 compliance
│   │   └── iso25010.ts             # ISO/IEC 25010 compliance
│   ├── utils/
│   │   ├── fileUtils.ts            # File utility functions
│   │   ├── pathValidator.ts        # Path validation and sanitization
│   │   ├── scoreUtils.ts           # Score normalization
│   │   ├── stringUtils.ts          # String utilities
│   │   └── testDetection.ts        # Test file detection
│   └── config/
│       └── securityConfig.ts       # Security configuration
├── tests/                           # Test files
├── dist/                            # Compiled output
├── .github/
│   ├── workflows/
│   │   └── ci.yml                  # GitHub Actions CI/CD
│   └── ISSUE_TEMPLATE/             # Issue templates
├── LICENSE                          # Apache License 2.0
├── NOTICE                           # Copyright notice
├── CONTRIBUTING.md                  # Contribution guidelines
├── README.md                        # This file
├── package.json                     # Dependencies and scripts
└── tsconfig.json                    # TypeScript configuration
```

## Scoring Weights

The overall score is calculated using these weights:

- **Documentation**: 20%
- **Tests**: 20%
- **Architecture**: 20%
- **Standards Compliance**: 20%
- **Security**: 10%
- **Git Hygiene**: 10%

## Supported File Types

- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)
- Python (.py)
- Java (.java, .kt, .scala)
- Markdown (.md, .mdx)
- JSON (.json)
- YAML (.yaml, .yml)
- XML (.xml)

## Ignored Directories

The scanner automatically ignores:

- node_modules
- .git
- dist, build
- coverage
- .next, out
- target
- __pycache__, .pytest_cache
- venv, .venv
- .idea, .vscode

## Standards Evaluated

### IEEE 829 (Software Testing)

- Test Plan
- Test Case Specifications
- Test Report
- Test Procedures

### IEEE 830 (Software Requirements)

- SRS Document
- Glossary
- Acceptance Criteria
- Non-functional Requirements

### ISO/IEC 25010 (Software Quality)

- Maintainability
- Modularity
- Testability
- Security

### ISO/IEC 12207 (Software Lifecycle)

- Requirements Process
- Design Process
- Implementation
- Verification
- Maintenance

## Security Checks

The security analyzer checks for:

- Hardcoded API keys and secrets
- Exposed credentials in connection strings
- .env files in repository
- Unsafe code patterns (eval, innerHTML)
- SQL injection risks
- Weak cryptographic algorithms

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on:

- How to fork the repository
- Creating branches
- Submitting pull requests
- Coding standards
- Commit message format

### Good First Issues

Look for issues labeled `good first issue` to get started:

- Improve large repository scanning performance
- Add support for additional test frameworks
- Improve architecture detection heuristics
- Add additional ISO/IEEE rules

## Roadmap

### v1.1.0 (Next)
- [ ] SARIF output format support
- [ ] GitHub Actions integration
- [ ] CI/CD pipeline templates

### v1.2.0
- [ ] Support for Python projects
- [ ] Support for Java/Kotlin projects
- [ ] Support for Go projects

### v2.0.0
- [ ] Web dashboard for visualizing audit results
- [ ] Historical trend analysis
- [ ] Team collaboration features

Want to contribute? Check our [good first issues](https://github.com/Mosipro1/mcp-git-auditor/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22).

## Versioning

This project follows [Semantic Versioning](https://semver.org/):

- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality additions
- PATCH version for backwards-compatible bug fixes

Current version: **v1.0.0**

### Tagging Releases

```bash
# Create a new version tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push the tag
git push origin v1.0.0
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

Copyright 2026 Mosiah - Developed in Bolivia

## Acknowledgments

- Built with the [Model Context Protocol SDK](https://github.com/modelcontextprotocol)
- Git operations powered by [simple-git](https://github.com/steveukx/git-js)
- File globbing by [fast-glob](https://github.com/mrmlnc/fast-glob)

## Support

For issues, questions, or contributions, please use:

- [GitHub Issues](https://github.com/mosiah/mcp-git-auditor/issues)
- [GitHub Discussions](https://github.com/mosiah/mcp-git-auditor/discussions)

---

**MCP Git Auditor** - Making code quality visible and measurable.
