/*
 * Copyright 2026 Mosiah
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND.
 */

import { Finding, SecurityFinding, ScannedFile, SecurityIssueType } from "../types/auditTypes";
import { sanitizePathForOutput } from "../utils/pathValidator";

const SECRET_PATTERNS = [
  { pattern: /(?<![a-zA-Z0-9])(?:api[_-]?key|apikey|access[_-]?token|auth[_-]?token)[=:]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi, type: "hardcoded_secret" as SecurityIssueType, name: "API Key" },
  { pattern: /(?<![a-zA-Z0-9])(?:secret|password|passwd|pwd)[=:]\s*['"]?([^\s'"]{8,})['"]?/gi, type: "hardcoded_secret" as SecurityIssueType, name: "Password" },
  { pattern: /(?<![a-zA-Z0-9])aws[_-]?(?:access[_-]?key[_-]?id|access[_-]?key)[=:]\s*['"]?([A-Z0-9]{20})['"]?/gi, type: "hardcoded_secret" as SecurityIssueType, name: "AWS Access Key" },
  { pattern: /(?<![a-zA-Z0-9])aws[_-]?(?:secret[_-]?access[_-]?key|secret[_-]?key)[=:]\s*['"]?([a-zA-Z0-9/+=]{40})['"]?/gi, type: "hardcoded_secret" as SecurityIssueType, name: "AWS Secret Key" },
  { pattern: /(?<![a-zA-Z0-9])(?:ghp_|gho_|ghu_|ghs_|ghr_)[a-zA-Z0-9]{36,}/gi, type: "hardcoded_secret" as SecurityIssueType, name: "GitHub Token" },
  { pattern: /(?<![a-zA-Z0-9])xox[baprs]-[a-zA-Z0-9]{10,}/gi, type: "hardcoded_secret" as SecurityIssueType, name: "Slack Token" },
  { pattern: /(?<![a-zA-Z0-9])sk-[a-zA-Z0-9]{48}/gi, type: "hardcoded_secret" as SecurityIssueType, name: "OpenAI API Key" },
  { pattern: /(?<![a-zA-Z0-9])pk_[a-zA-Z0-9]{24,}/gi, type: "hardcoded_secret" as SecurityIssueType, name: "Stripe API Key" },
  { pattern: /(?<![a-zA-Z0-9])-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/gi, type: "exposed_credentials" as SecurityIssueType, name: "Private Key" },
  { pattern: /mysql:\/\/[^:]+:[^@]+@/gi, type: "exposed_credentials" as SecurityIssueType, name: "Database Credentials" },
  { pattern: /postgres:\/\/[^:]+:[^@]+@/gi, type: "exposed_credentials" as SecurityIssueType, name: "PostgreSQL Credentials" },
  { pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi, type: "exposed_credentials" as SecurityIssueType, name: "MongoDB Credentials" },
  { pattern: /redis:\/\/[^:]+:[^@]+@/gi, type: "exposed_credentials" as SecurityIssueType, name: "Redis Credentials" },
];

const UNSAFE_CODE_PATTERNS = [
  { pattern: /eval\s*\(/g, type: "unsafe_code" as SecurityIssueType, severity: "high", name: "Use of eval()" },
  { pattern: /new\s+Function\s*\(/g, type: "unsafe_code" as SecurityIssueType, severity: "high", name: "Dynamic function creation" },
  { pattern: /innerHTML\s*=/g, type: "xss_vulnerability" as SecurityIssueType, severity: "medium", name: "Potential XSS via innerHTML" },
  { pattern: /dangerouslySetInnerHTML/g, type: "xss_vulnerability" as SecurityIssueType, severity: "medium", name: "React dangerous HTML" },
  { pattern: /exec\s*\(\s*.*\+/g, type: "unsafe_code" as SecurityIssueType, severity: "high", name: "Command injection risk" },
  { pattern: /spawn\s*\(\s*.*\+/g, type: "unsafe_code" as SecurityIssueType, severity: "medium", name: "Process spawn with interpolation" },
  { pattern: /process\.env\[/g, type: "unsafe_code" as SecurityIssueType, severity: "low", name: "Direct environment access" },
  { pattern: /crypto\.createHash\s*\(\s*['"]md5['"]/g, type: "weak_crypto" as SecurityIssueType, severity: "medium", name: "Weak hash algorithm (MD5)" },
  { pattern: /crypto\.createHash\s*\(\s*['"]sha1['"]/g, type: "weak_crypto" as SecurityIssueType, severity: "medium", name: "Weak hash algorithm (SHA1)" },
  { pattern: /password_hash\s*\(\s*['"]MD5['"]/g, type: "weak_crypto" as SecurityIssueType, severity: "medium", name: "PHP weak hash (MD5)" },
  { pattern: /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\+["\']/gi, type: "sql_injection" as SecurityIssueType, severity: "high", name: "Potential SQL injection" },
  { pattern: /executeQuery\s*\(\s*.*\+["\']/gi, type: "sql_injection" as SecurityIssueType, severity: "high", name: "Potential SQL injection" },
];

const ENV_FILE_PATTERNS = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".env.test",
  ".env.example",
  ".env.sample",
];

/**
 * Checks if a match is in a valid code context (not in comments, strings, or definitions)
 */
function isValidCodeContext(
  content: string,
  matchIndex: number,
  _patternName: string
): boolean {
  const lines = content.substring(0, matchIndex).split("\n");
  const currentLine = lines[lines.length - 1];
  const lineStart = content.lastIndexOf("\n", matchIndex) + 1;
  const lineEnd = content.indexOf("\n", matchIndex);
  const fullLine = content.substring(
    lineStart,
    lineEnd === -1 ? undefined : lineEnd
  );

  // Ignore single-line comments (except if it's a URL in comment)
  if (currentLine.includes("//") && !fullLine.includes("http")) {
    return false;
  }

  // Ignore pattern definitions (this file itself)
  if (
    currentLine.includes("pattern:") ||
    currentLine.includes('type: "') ||
    currentLine.includes('name: "')
  ) {
    return false;
  }

  // Ignore pattern imports/requires
  if (
    fullLine.includes("import") ||
    fullLine.includes("export") ||
    fullLine.includes("const")
  ) {
    // Check if it's a pattern array definition
    if (
      content.substring(matchIndex - 100, matchIndex).includes("PATTERNS") ||
      content.substring(matchIndex - 50, matchIndex).includes("{")
    ) {
      return false;
    }
  }

  // Ignore strings that look like pattern definitions
  if (
    fullLine.includes("UNSAFE_CODE_PATTERNS") ||
    fullLine.includes("SECRET_PATTERNS") ||
    fullLine.includes("pattern =")
  ) {
    return false;
  }

  return true;
}

/**
 * Checks if the file is the securityAnalyzer.ts itself
 */
function isSecurityAnalyzerFile(filePath: string): boolean {
  return filePath.includes("securityAnalyzer.ts");
}

export async function analyzeSecurity(files: ScannedFile[]): Promise<{
  findings: Finding[];
  score: number;
  secretsDetected: boolean;
}> {
  const findings: SecurityFinding[] = [];

  const sourceFiles = files.filter(
    (f) =>
      f.type === "typescript" ||
      f.type === "javascript" ||
      f.type === "python" ||
      f.type === "java"
  );

  const envFiles = files.filter((f) =>
    ENV_FILE_PATTERNS.some((p) => f.name.toLowerCase() === p.toLowerCase())
  );

  for (const envFile of envFiles) {
    findings.push({
      type: "env_exposed",
      severity: "high",
      file: sanitizePathForOutput(envFile.relativePath),
      description: `.env file detected in repository. Environment files typically contain secrets and should not be committed.`,
      evidence: envFile.name,
    });
  }

  for (const file of sourceFiles) {
    try {
      const content = await readFileContent(file.path);
      if (!content) continue;

      // Skip analysis of unsafe patterns in the analyzer's own file
      const skipUnsafePatterns = isSecurityAnalyzerFile(file.path);

      for (const secretPattern of SECRET_PATTERNS) {
        const matches = content.matchAll(secretPattern.pattern);
        for (const match of matches) {
          // Check if the match is in valid context
          const matchIndex = match.index ?? 0;
          if (
            !isValidCodeContext(
              content,
              matchIndex,
              secretPattern.name || ""
            )
          ) {
            continue;
          }

          findings.push({
            type: secretPattern.type,
            severity:
              secretPattern.type === "hardcoded_secret" ? "high" : "critical",
            file: sanitizePathForOutput(file.relativePath),
            description: `Potential ${secretPattern.name} detected. Secrets should not be hardcoded in source code.`,
            evidence: match[0].substring(0, 50) + "...",
          });
        }
      }

      for (const unsafePattern of UNSAFE_CODE_PATTERNS) {
        const matches = content.matchAll(unsafePattern.pattern);
        for (const match of matches) {
          const matchIndex = match.index ?? 0;

          // Skip analysis of unsafe patterns in the analyzer's own file
          if (skipUnsafePatterns) {
            if (
              !isValidCodeContext(
                content,
                matchIndex,
                unsafePattern.name || ""
              )
            ) {
              continue;
            }
          }

          findings.push({
            type: unsafePattern.type,
            severity: unsafePattern.severity as "low" | "medium" | "high",
            file: sanitizePathForOutput(file.relativePath),
            description: `${unsafePattern.name} detected in ${file.name}. This pattern may introduce security vulnerabilities.`,
            evidence: match[0],
          });
        }
      }
    } catch (error) {
      // Silently skip files that can't be read
    }
  }

  const secretsFound = findings.some(
    (f) => f.type === "hardcoded_secret" || f.type === "exposed_credentials"
  );

  let score = 100;

  const highSeverityCount = findings.filter((f) => f.severity === "high").length;
  const mediumSeverityCount = findings.filter((f) => f.severity === "medium").length;

  score -= highSeverityCount * 20;
  score -= mediumSeverityCount * 10;

  score = Math.max(score, 0);

  const findingsForReport: Finding[] = findings.map((f) => ({
    id: `SEC-${findings.indexOf(f) + 1}`,
    area: "Security",
    severity: f.severity,
    title: `${f.type.replace(/_/g, " ")} detected`,
    description: f.description,
    evidence: f.evidence ? [f.evidence] : undefined,
    confidence: 0.9,
  }));

  return {
    findings: findingsForReport,
    score,
    secretsDetected: secretsFound,
  };
}

async function readFileContent(filePath: string): Promise<string | null> {
  try {
    const fs = await import("fs/promises");
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch {
    return null;
  }
}

export function getSecurityFindings(_files: ScannedFile[]): Finding[] {
  return [];
}
