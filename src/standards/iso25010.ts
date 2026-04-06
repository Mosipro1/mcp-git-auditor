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

import { StandardResult, Finding, ScannedFile, DocumentationArtifact, TestArtifact } from "../types/auditTypes";

export function evaluateISO25010(
  files: ScannedFile[],
  documentationArtifacts: DocumentationArtifact[],
  testArtifacts: TestArtifact[]
): StandardResult {
  const findings: Finding[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];

  const hasModularity = checkModularity(files);
  const hasTestability = testArtifacts.length > 0;
  const hasAnalyzability = checkAnalyzability(files);
  const hasSecurityDocs = documentationArtifacts.some(
    (d) =>
      d.name.toLowerCase().includes("security") ||
      d.name.toLowerCase().includes("threat")
  );

  if (!hasModularity) {
    findings.push({
      id: "ISO25010-001",
      area: "ISO 25010",
      severity: "medium",
      title: "Modularity concerns",
      description: "Code organization may not demonstrate clear modularity",
      confidence: 0.6,
      recommendation: "Structure code into distinct, loosely-coupled modules",
    });
  } else {
    findings.push({
      id: "ISO25010-002",
      area: "ISO 25010",
      severity: "info",
      title: "Modularity present",
      description: "Code shows evidence of modular organization",
      confidence: 0.7,
    });
  }

  if (!hasTestability) {
    findings.push({
      id: "ISO25010-003",
      area: "ISO 25010",
      severity: "high",
      title: "Testability concerns",
      description: "No tests found. Testability is a key quality attribute.",
      confidence: 0.9,
      recommendation: "Implement automated tests to improve testability",
    });
    missing.push("Testability (automated tests)");
  }

  if (!hasAnalyzability) {
    findings.push({
      id: "ISO25010-004",
      area: "ISO 25010",
      severity: "medium",
      title: "Analyzability concerns",
      description: "Code structure may hinder analysis and debugging",
      confidence: 0.6,
      recommendation: "Add clear code structure and logging for better analysis",
    });
  }

  if (!hasSecurityDocs) {
    missing.push("Security documentation");
    recommendations.push("Add security documentation addressing threat models");
  }

  let score = 0;
  if (hasModularity) score += 25;
  if (hasTestability) score += 25;
  if (hasAnalyzability) score += 20;
  if (hasSecurityDocs) score += 15;
  score += Math.min(testArtifacts.length * 3, 15);

  const compliant = score >= 60;

  return {
    compliant,
    score: Math.min(score, 100),
    findings,
    missing,
    recommendations,
  };
}

function checkModularity(files: ScannedFile[]): boolean {
  const sourceFiles = files.filter(
    (f) =>
      f.type === "typescript" ||
      f.type === "javascript" ||
      f.type === "python" ||
      f.type === "java"
  );

  if (sourceFiles.length === 0) return false;

  const uniqueDirs = new Set(
    sourceFiles.map((f) => {
      const parts = f.relativePath.split("/");
      return parts.length > 1 ? parts[0] : "root";
    })
  );

  return uniqueDirs.size >= 2 && sourceFiles.length / Math.max(uniqueDirs.size, 1) <= 30;
}

function checkAnalyzability(files: ScannedFile[]): boolean {
  const sourceFiles = files.filter(
    (f) =>
      f.type === "typescript" ||
      f.type === "javascript" ||
      f.type === "python" ||
      f.type === "java"
  );

  if (sourceFiles.length === 0) return false;

  const avgFileSize = sourceFiles.reduce((sum, f) => sum + f.size, 0) / sourceFiles.length;

  return avgFileSize < 100 * 1024;
}
