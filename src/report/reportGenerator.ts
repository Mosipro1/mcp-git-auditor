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

import {
  AuditReport,
  RepositoryScanResult,
  GitMetadata,
  ScannedFile,
  Finding,
  DocumentationArtifact,
  TestArtifact,
} from "../types/auditTypes";
import { analyzeDocumentation } from "../analyzers/documentationAnalyzer";
import { analyzeTests } from "../analyzers/testAnalyzer";
import { analyzeArchitecture } from "../analyzers/architectureAnalyzer";
import { analyzeSecurity } from "../analyzers/securityAnalyzer";
import { analyzeCodeQuality } from "../analyzers/codeQualityAnalyzer";
import { runComplianceChecks, calculateStandardsScore } from "../engine/complianceEngine";
import {
  calculateOverallScore,
  determineRiskLevel,
  identifyStrengths,
  identifyWeaknesses,
  generateRecommendations,
  ComponentScores,
} from "../engine/scoringEngine";
import { analyzeCommitQuality } from "../scanner/gitScanner";
import { isTestFile as checkIsTestFile } from "../utils/testDetection";
import { sanitizePathForOutput } from "../utils/pathValidator";

export interface AuditContext {
  scanResult: RepositoryScanResult;
  gitMetadata: GitMetadata;
}

export async function generateAuditReport(context: AuditContext): Promise<AuditReport> {
  const { scanResult, gitMetadata } = context;
  const files = scanResult.files;
  const errors: { code: string; message: string; path?: string }[] = [];

  const sourceFiles = files.filter(
    (f) =>
      f.type === "typescript" ||
      f.type === "javascript" ||
      f.type === "python" ||
      f.type === "java"
  );
  const testFiles = files.filter((f) => isTestFile(f));
  const docFiles = files.filter(
    (f) => f.type === "markdown" || f.type === "json" || f.type === "yaml"
  );

  const documentationAnalysis = analyzeDocumentation(docFiles);
  const documentationArtifacts = extractDocumentationArtifacts(docFiles);

  const testAnalysis = analyzeTests(files, docFiles);
  const testArtifacts = extractTestArtifacts(testFiles);

  const architectureAnalysis = analyzeArchitecture(
    files,
    scanResult.directories
  );

  const securityAnalysis = await analyzeSecurity(files);

  const codeQualityAnalysis = analyzeCodeQuality(files);

  const commitQuality = analyzeCommitQuality(gitMetadata.commits);

  const standards = runComplianceChecks({
    files,
    testArtifacts,
    documentationArtifacts,
  });

  const standardsScore = calculateStandardsScore(standards);

  const componentScores: ComponentScores = {
    documentation: documentationAnalysis.score,
    tests: testAnalysis.score,
    architecture: architectureAnalysis.modularityScore,
    standards: standardsScore,
    security: securityAnalysis.score,
    gitHygiene: commitQuality.score,
  };

  const overallScore = calculateOverallScore(componentScores);

  const allFindings: Finding[] = [
    ...documentationAnalysis.findings,
    ...testAnalysis.findings,
    ...architectureAnalysis.findings,
    ...securityAnalysis.findings,
    ...codeQualityAnalysis.findings,
  ];

  const riskLevel = determineRiskLevel(
    overallScore,
    securityAnalysis.score,
    allFindings
  );

  const keyStrengths = identifyStrengths(componentScores, gitMetadata);
  const keyWeaknesses = identifyWeaknesses(componentScores, allFindings);
  const recommendations = generateRecommendations(allFindings, componentScores);

  const byType: Record<string, number> = {};
  for (const file of files) {
    const type = file.type;
    byType[type] = (byType[type] || 0) + 1;
  }

  return {
    repository: scanResult.rootPath,
    scanDate: new Date().toISOString(),
    fileCount: files.length,
    sourceFileCount: sourceFiles.length,
    testFileCount: testFiles.length,
    documentationFileCount: docFiles.length,
    summary: {
      overallScore,
      riskLevel,
      keyStrengths,
      keyWeaknesses,
      recommendations,
    },
    git: {
      commitCount: gitMetadata.commitCount,
      branchCount: gitMetadata.branchCount,
      commitQuality: {
        score: commitQuality.score,
        findings: commitQuality.findings,
      },
    },
    documentation: {
      score: documentationAnalysis.score,
      findings: documentationAnalysis.findings,
      artifacts: documentationAnalysis.artifacts,
    },
    tests: {
      score: testAnalysis.score,
      frameworkDetected: testAnalysis.frameworkDetected,
      findings: testAnalysis.findings,
      artifacts: testAnalysis.artifacts,
    },
    architecture: {
      detectedPattern: architectureAnalysis.detectedPattern,
      modularityScore: architectureAnalysis.modularityScore,
      findings: architectureAnalysis.findings,
    },
    standards: {
      IEEE829: standards.IEEE829,
      IEEE830: standards.IEEE830,
      ISO25010: standards.ISO25010,
      ISO12207: standards.ISO12207,
    },
    security: {
      score: securityAnalysis.score,
      findings: securityAnalysis.findings,
      secretsDetected: securityAnalysis.secretsDetected,
    },
    files: {
      byType,
      ignored: scanResult.ignoredPaths.map(sanitizePathForOutput),
      scanned: files.map((f) => sanitizePathForOutput(f.relativePath)),
    },
    errors,
  };
}

function isTestFile(file: ScannedFile): boolean {
  // Usar la función unificada del módulo de utilidades
  return checkIsTestFile(file.name);
}

function extractDocumentationArtifacts(
  files: ScannedFile[]
): DocumentationArtifact[] {
  return files.map((file) => ({
    type: detectDocType(file.name),
    path: sanitizePathForOutput(file.relativePath),
    name: file.name,
  }));
}

function detectDocType(fileName: string): DocumentationArtifact["type"] {
  const lower = fileName.toLowerCase();
  if (lower.includes("readme")) return "readme";
  if (lower.includes("requirement") || lower.includes("srs")) return "srs";
  if (lower.includes("architecture") || lower.includes("arch")) return "architecture";
  if (lower.includes("design")) return "design";
  if (lower.includes("test_plan") || lower.includes("test plan")) return "test_plan";
  if (lower.includes("test_case") || lower.includes("test case")) return "test_case";
  if (lower.includes("test_report") || lower.includes("test report")) return "test_report";
  if (lower.includes("changelog") || lower.includes("history")) return "changelog";
  if (lower.includes("license")) return "license";
  if (lower.includes("contributing")) return "contributing";
  if (lower.includes("api")) return "api_docs";
  return "other";
}

function extractTestArtifacts(files: ScannedFile[]): TestArtifact[] {
  return files.map((file) => ({
    type: detectTestType(file),
    path: sanitizePathForOutput(file.relativePath),
    name: file.name,
  }));
}

function detectTestType(file: ScannedFile): TestArtifact["type"] {
  const filePath = file.relativePath.toLowerCase();

  if (filePath.includes("integration")) return "integration";
  if (filePath.includes("e2e") || filePath.includes("end-to-end")) return "e2e";
  if (filePath.includes("performance")) return "performance";
  if (filePath.includes("security")) return "security";
  return "unit";
}
