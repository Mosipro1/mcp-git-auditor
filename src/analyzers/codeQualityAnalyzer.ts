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

import { Finding, ScannedFile } from "../types/auditTypes";
import { sanitizePathForOutput } from "../utils/pathValidator";

interface FileSizeResult {
  path: string;
  size: number;
  lines?: number;
}

interface NamingResult {
  issues: string[];
  score: number;
}

export function analyzeCodeQuality(files: ScannedFile[]): {
  findings: Finding[];
  score: number;
} {
  const findings: Finding[] = [];
  const sourceFiles = files.filter(
    (f) =>
      f.type === "typescript" ||
      f.type === "javascript" ||
      f.type === "python" ||
      f.type === "java"
  );

  const largeFiles = findLargeFiles(sourceFiles);
  const namingIssues = checkNamingConventions(sourceFiles);
  void checkComplexityIndicators(sourceFiles);

  if (largeFiles.length > 0) {
    findings.push({
      id: "QUAL-001",
      area: "Code Quality",
      severity: "medium",
      title: "Large files detected",
      description: `Found ${largeFiles.length} files exceeding 500 lines. Large files can indicate poor code organization and decreased maintainability.`,
      evidence: largeFiles.slice(0, 5).map((f) => `${f.path}: ${f.lines || f.size} lines`),
      confidence: 0.8,
      recommendation: "Split large files into smaller, focused modules",
    });
  }

  if (namingIssues.issues.length > 0) {
    findings.push({
      id: "QUAL-002",
      area: "Code Quality",
      severity: "low",
      title: "Naming convention issues",
      description: `Found ${namingIssues.issues.length} potential naming inconsistencies.`,
      evidence: namingIssues.issues.slice(0, 5),
      confidence: 0.6,
      recommendation: "Follow consistent naming conventions (e.g., camelCase, PascalCase, snake_case)",
    });
  }

  let score = 100;

  score -= largeFiles.length * 5;
  score -= namingIssues.score > 0 ? 10 : 0;

  score = Math.max(score, 0);

  return {
    findings,
    score: Math.min(score, 100),
  };
}

function findLargeFiles(files: ScannedFile[]): FileSizeResult[] {
  const largeFiles: FileSizeResult[] = [];

  for (const file of files) {
    if (file.size > 500 * 1024) {
      largeFiles.push({
        path: sanitizePathForOutput(file.relativePath),
        size: file.size,
      });
    }
  }

  return largeFiles.sort((a, b) => b.size - a.size);
}

function checkNamingConventions(files: ScannedFile[]): NamingResult {
  const issues: string[] = [];
  const fileNames = files.map((f) => f.name);

  const camelCaseCount = fileNames.filter(
    (n) => /^[a-z][a-z0-9]*([A-Z][a-z0-9]*)*(\.[a-z]+)?$/.test(n.replace(/\.[^.]+$/, ""))
  ).length;
  const snakeCaseCount = fileNames.filter(
    (n) => /^[a-z][a-z0-9]*(_[a-z0-9]+)*(\.[a-z]+)?$/.test(n.replace(/\.[^.]+$/, ""))
  ).length;
  const pascalCaseCount = fileNames.filter(
    (n) => /^[A-Z][a-z0-9]*([A-Z][a-z0-9]*)*(\.[a-z]+)?$/.test(n.replace(/\.[^.]+$/, ""))
  ).length;

  const total = files.length;
  const dominantPattern = Math.max(camelCaseCount, snakeCaseCount, pascalCaseCount);
  const consistencyRatio = total > 0 ? dominantPattern / total : 1;

  if (consistencyRatio < 0.7 && total > 10) {
    issues.push("Mixed naming conventions detected across files");
  }

  return {
    issues,
    score: consistencyRatio >= 0.7 ? 0 : 20,
  };
}

function checkComplexityIndicators(files: ScannedFile[]): string[] {
  const issues: string[] = [];

  const flatStructure = files.length > 20 && new Set(files.map((f) => f.relativePath.split("/")[0])).size <= 2;

  if (flatStructure) {
    issues.push("Flat directory structure may indicate poor organization");
  }

  return issues;
}

export function calculateMaintainabilityIndex(files: ScannedFile[]): number {
  const sourceFiles = files.filter(
    (f) =>
      f.type === "typescript" ||
      f.type === "javascript" ||
      f.type === "python" ||
      f.type === "java"
  );

  if (sourceFiles.length === 0) {
    return 0;
  }

  const avgFileSize =
    sourceFiles.reduce((sum, f) => sum + f.size, 0) / sourceFiles.length;

  const uniqueDirs = new Set(
    sourceFiles.map((f) => {
      const parts = f.relativePath.split("/");
      return parts.length > 1 ? parts[0] : "root";
    })
  );

  let score = 50;

  if (avgFileSize < 50 * 1024) score += 20;
  else if (avgFileSize < 100 * 1024) score += 10;

  score += Math.min(uniqueDirs.size * 5, 30);

  return Math.min(score, 100);
}
