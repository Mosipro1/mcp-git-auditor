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

import { StandardResult, Finding, TestArtifact, DocumentationArtifact } from "../types/auditTypes";

export function evaluateIEEE829(
  testArtifacts: TestArtifact[],
  documentationArtifacts: DocumentationArtifact[]
): StandardResult {
  const findings: Finding[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];

  const hasTestPlan = documentationArtifacts.some(
    (d) => d.type === "test_plan" || d.name.toLowerCase().includes("test plan")
  );
  const hasTestCase = documentationArtifacts.some(
    (d) => d.type === "test_case" || d.name.toLowerCase().includes("test case")
  );
  const hasTestReport = documentationArtifacts.some(
    (d) => d.type === "test_report" || d.name.toLowerCase().includes("test report")
  );
  const hasTestProcedures = documentationArtifacts.some((d) =>
    d.name.toLowerCase().includes("procedure")
  );

  if (!hasTestPlan) {
    missing.push("Test Plan document");
    recommendations.push("Create a formal Test Plan following IEEE 829 template");
  } else {
    findings.push({
      id: "IEEE829-001",
      area: "IEEE 829",
      severity: "info",
      title: "Test Plan present",
      description: "Test Plan document found",
      confidence: 0.9,
    });
  }

  if (!hasTestCase) {
    missing.push("Test Case specifications");
    recommendations.push("Document test cases with clear preconditions, inputs, and expected outputs");
  } else {
    findings.push({
      id: "IEEE829-002",
      area: "IEEE 829",
      severity: "info",
      title: "Test Cases present",
      description: "Test Case specifications found",
      confidence: 0.9,
    });
  }

  if (!hasTestReport) {
    missing.push("Test Report");
    recommendations.push("Generate test reports after test execution");
  }

  if (!hasTestProcedures) {
    missing.push("Test Procedures");
    recommendations.push("Document test procedures for test execution");
  }

  const hasTestExecution = testArtifacts.length > 0;
  if (!hasTestExecution) {
    findings.push({
      id: "IEEE829-003",
      area: "IEEE 829",
      severity: "medium",
      title: "No test execution artifacts found",
      description: "No test files detected in repository",
      confidence: 0.9,
      recommendation: "Implement tests using a testing framework",
    });
  }

  let score = 0;
  if (hasTestPlan) score += 25;
  if (hasTestCase) score += 25;
  if (hasTestReport) score += 20;
  if (hasTestProcedures) score += 10;
  if (hasTestExecution) score += 20;

  const compliant = score >= 50;

  return {
    compliant,
    score,
    findings,
    missing,
    recommendations,
  };
}
