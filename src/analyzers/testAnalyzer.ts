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

import { Finding, TestArtifact, TestType, ScannedFile } from "../types/auditTypes";
import {
  isTestFile as checkIsTestFile,
  isInTestDirectory,
  detectTestFramework,
  detectTestType as detectTestTypeUtil,
} from "../utils/testDetection";
import { sanitizePathForOutput } from "../utils/pathValidator";

// Re-export framework configs para backward compatibility
export { TEST_FRAMEWORK_CONFIGS as TEST_FRAMEWORKS } from "../utils/testDetection";

export function analyzeTests(
  files: ScannedFile[],
  docFiles: ScannedFile[]
): {
  artifacts: string[];
  findings: Finding[];
  score: number;
  frameworkDetected: string | null;
} {
  const artifacts: TestArtifact[] = [];
  const findings: Finding[] = [];
  let frameworkDetected: string | null = null;

  const testFiles = files.filter((f) => isTestFile(f));
  const allFiles = [...files, ...docFiles];

  // Detectar framework usando la utilidad compartida
  frameworkDetected = detectTestFramework(allFiles);

  for (const file of testFiles) {
    const testType = detectTestType(file);
    artifacts.push({
      type: testType,
      path: sanitizePathForOutput(file.relativePath),
      name: file.name,
      framework: frameworkDetected || undefined,
    });
  }

  const hasTestFiles = testFiles.length > 0;
  const hasTestConfig = frameworkDetected !== null;
  const hasTestDirectories = files.some((f) =>
    isInTestDirectory(f.relativePath)
  );

  if (!hasTestFiles) {
    findings.push({
      id: "TEST-001",
      area: "Tests",
      severity: "high",
      title: "No test files detected",
      description:
        "No test files found in the repository. Testing is essential for code quality and maintainability according to ISO 25010.",
      confidence: 0.9,
      recommendation: "Add unit tests, integration tests, or E2E tests using a testing framework like Jest, Vitest, or PyTest",
    });
  }

  if (!hasTestConfig) {
    findings.push({
      id: "TEST-002",
      area: "Tests",
      severity: "medium",
      title: "No test framework configuration detected",
      description:
        "No test framework configuration file found. A properly configured testing framework ensures consistent test execution.",
      confidence: 0.7,
      recommendation: "Configure a testing framework with appropriate settings",
    });
  }

  if (!hasTestDirectories && hasTestFiles) {
    findings.push({
      id: "TEST-003",
      area: "Tests",
      severity: "low",
      title: "Tests not in dedicated directory",
      description:
        "Test files exist but are not organized in a dedicated test directory. Standard project structure typically includes /test or /tests directories.",
      confidence: 0.6,
      recommendation: "Consider organizing tests into dedicated test directories",
    });
  }

  let score = 0;
  if (hasTestFiles) score += 40;
  if (hasTestConfig) score += 30;
  if (hasTestDirectories) score += 20;
  if (frameworkDetected) score += 10;

  return {
    artifacts: artifacts.map((a) => a.path),
    findings,
    score: Math.min(score, 100),
    frameworkDetected,
  };
}

function isTestFile(file: ScannedFile): boolean {
  // Usar la función unificada del módulo de utilidades
  return checkIsTestFile(file.name);
}

function detectTestType(file: ScannedFile): TestType {
  // Usar la función unificada del módulo de utilidades
  return detectTestTypeUtil(file.relativePath, file.name) as TestType;
}

export function getTestArtifacts(files: ScannedFile[]): TestArtifact[] {
  const testFiles = files.filter((f) => isTestFile(f));

  return testFiles.map((file) => ({
    type: detectTestType(file),
    path: sanitizePathForOutput(file.relativePath),
    name: file.name,
  }));
}
