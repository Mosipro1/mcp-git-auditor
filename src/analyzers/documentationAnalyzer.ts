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

import { Finding, DocumentationArtifact, DocumentationType, ScannedFile } from "../types/auditTypes";
import { sanitizePathForOutput } from "../utils/pathValidator";

const DOC_TYPE_PATTERNS: Record<DocumentationType, RegExp[]> = {
  readme: [/^readme/i, /^read_me/i],
  srs: [/^srs/i, /requirements/i, /specification/i, /-reqs?/i],
  architecture: [/^architecture/i, /^arch/i, /structural/i],
  design: [/^design/i, /-design/i, /_design/i],
  test_plan: [/test.?plan/i, /testplan/i],
  test_case: [/test.?case/i, /testcase/i, /test.?spec/i],
  test_report: [/test.?report/i, /testreport/i, /test.?result/i],
  changelog: [/^changelog/i, /^history/i, /^change.?log/i],
  license: [/^license/i, /^copying/i, /^copyright/i],
  contributing: [/^contributing/i, /^contribute/i],
  api_docs: [/api.?doc/i, /swagger/i, /openapi/i, /rest.?doc/i],
  deployment: [/deploy/i, /installation/i, /setup/i, /install/i],
  other: [],
};

export function analyzeDocumentation(files: ScannedFile[]): {
  artifacts: string[];
  findings: Finding[];
  score: number;
} {
  const artifacts: DocumentationArtifact[] = [];
  const findings: Finding[] = [];
  
  const docFiles = files.filter(
    (f) => f.type === "markdown" || f.type === "json" || f.type === "yaml"
  );

  for (const file of docFiles) {
    const docType = detectDocumentationType(file.name);
    const quality = assessDocumentationQuality(file.name, file.relativePath);
    
    artifacts.push({
      type: docType,
      path: sanitizePathForOutput(file.relativePath),
      name: file.name,
      quality,
    });
  }

  const readmeExists = artifacts.some((a) => a.type === "readme");
  const srsExists = artifacts.some((a) => a.type === "srs");
  const testDocsExist = artifacts.some(
    (a) =>
      a.type === "test_plan" || a.type === "test_case" || a.type === "test_report"
  );
  const architectureDocsExist = artifacts.some(
    (a) => a.type === "architecture" || a.type === "design"
  );

  if (!readmeExists) {
    findings.push(createFinding(
      "DOC-001",
      "Documentation",
      "medium",
      "Missing README file",
      "No README file found in the repository root. README files provide essential project overview and usage instructions.",
      0.8,
      undefined,
      ["Add a README.md file with project overview, installation, and usage instructions"]
    ));
  }

  if (!srsExists) {
    findings.push(createFinding(
      "DOC-002",
      "Documentation",
      "medium",
      "Missing SRS/Requirements document",
      "No Software Requirements Specification or requirements document found. IEEE 830 recommends clear requirements documentation.",
      0.7,
      undefined,
      ["Consider adding a formal SRS or requirements document"]
    ));
  }

  if (!testDocsExist) {
    findings.push(createFinding(
      "DOC-003",
      "Documentation",
      "low",
      "Missing test documentation",
      "No test plans, test cases, or test reports found. IEEE 829 recommends test documentation for verification.",
      0.6,
      undefined,
      ["Add test documentation (test plan, test cases, test reports)"]
    ));
  }

  if (!architectureDocsExist) {
    findings.push(createFinding(
      "DOC-004",
      "Documentation",
      "low",
      "Missing architecture/design documentation",
      "No architecture or design documentation found. Clear architectural documentation supports maintainability.",
      0.6,
      undefined,
      ["Consider adding architecture or design documentation"]
    ));
  }

  const readmeQuality = artifacts.find((a) => a.type === "readme")?.quality || 0;
  if (readmeExists && readmeQuality < 50) {
    findings.push(createFinding(
      "DOC-005",
      "Documentation",
      "medium",
      "Low quality README",
      "README exists but appears to have minimal content. A good README should include overview, installation, usage, and contribution guidelines.",
      0.7,
      undefined,
      ["Enhance README with comprehensive content"]
    ));
  }

  let score = 0;
  if (readmeExists) score += 30;
  if (srsExists) score += 25;
  if (testDocsExist) score += 20;
  if (architectureDocsExist) score += 15;
  if (readmeQuality >= 50) score += 10;

  return {
    artifacts: artifacts.map((a) => a.path),
    findings,
    score: Math.min(score, 100),
  };
}

function detectDocumentationType(fileName: string): DocumentationType {
  for (const [type, patterns] of Object.entries(DOC_TYPE_PATTERNS)) {
    if (type === "other") continue;
    for (const pattern of patterns) {
      if (pattern.test(fileName)) {
        return type as DocumentationType;
      }
    }
  }
  return "other";
}

function assessDocumentationQuality(fileName: string, filePath: string): number {
  let quality = 50;

  const lowerName = fileName.toLowerCase();
  
  if (lowerName.includes("readme")) {
    quality += 20;
  }
  
  if (filePath.split("/").length <= 2) {
    quality += 10;
  }

  return Math.min(quality, 100);
}

function createFinding(
  id: string,
  area: string,
  severity: "info" | "low" | "medium" | "high" | "critical",
  title: string,
  description: string,
  confidence: number,
  evidence?: string[],
  recommendation?: string[]
): Finding {
  return {
    id,
    area,
    severity,
    title,
    description,
    evidence,
    confidence,
    recommendation: recommendation?.join("; "),
  };
}

export function getDocumentationArtifacts(files: ScannedFile[]): DocumentationArtifact[] {
  const docFiles = files.filter(
    (f) => f.type === "markdown" || f.type === "json" || f.type === "yaml"
  );

  return docFiles.map((file) => ({
    type: detectDocumentationType(file.name),
    path: sanitizePathForOutput(file.relativePath),
    name: file.name,
    quality: assessDocumentationQuality(file.name, file.relativePath),
  }));
}
