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

export interface AuditReport {
  repository: string;
  scanDate: string;
  fileCount: number;
  sourceFileCount: number;
  testFileCount: number;
  documentationFileCount: number;

  summary: SummarySection;
  git: GitSection;
  documentation: DocumentationSection;
  tests: TestsSection;
  architecture: ArchitectureSection;
  standards: StandardsSection;
  security: SecuritySection;
  files: FilesSection;
  errors: AuditError[];
}

export interface SummarySection {
  overallScore: number;
  riskLevel: RiskLevel;
  keyStrengths: string[];
  keyWeaknesses: string[];
  recommendations: string[];
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface GitSection {
  commitCount: number | null;
  branchCount: number | null;
  commitQuality: CommitQuality;
}

export interface CommitQuality {
  score: number;
  findings: string[];
}

export interface DocumentationSection {
  score: number;
  findings: Finding[];
  artifacts: string[];
}

export interface TestsSection {
  score: number;
  frameworkDetected: string | null;
  findings: Finding[];
  artifacts: string[];
}

export interface ArchitectureSection {
  detectedPattern: string | null;
  modularityScore: number;
  findings: Finding[];
}

export interface StandardsSection {
  IEEE829: StandardResult;
  IEEE830: StandardResult;
  ISO25010: StandardResult;
  ISO12207: StandardResult;
}

export interface StandardResult {
  compliant: boolean;
  score: number;
  findings: Finding[];
  missing: string[];
  recommendations: string[];
}

export interface Finding {
  id: string;
  area: string;
  severity: Severity;
  title: string;
  description: string;
  evidence?: string[];
  confidence: number;
  recommendation?: string;
}

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export interface SecuritySection {
  score: number;
  findings: Finding[];
  secretsDetected: boolean;
}

export interface FilesSection {
  byType: Record<string, number>;
  ignored: string[];
  scanned: string[];
}

export interface AuditError {
  code: string;
  message: string;
  path?: string;
}

export interface ScannedFile {
  path: string;
  relativePath: string;
  name: string;
  extension: string;
  type: FileType;
  size: number;
  isBinary: boolean;
  content?: string;
}

export type FileType =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "markdown"
  | "json"
  | "yaml"
  | "xml"
  | "pdf"
  | "docx"
  | "other";

export interface RepositoryScanResult {
  rootPath: string;
  files: ScannedFile[];
  directories: string[];
  ignoredPaths: string[];
}

export interface GitMetadata {
  isGitRepo: boolean;
  commitCount: number | null;
  branchCount: number | null;
  branches: string[];
  commits: GitCommit[];
  tags: string[];
  hasRemote: boolean;
}

export interface GitCommit {
  hash: string;
  date: Date;
  message: string;
  author: string;
}

export interface DocumentationArtifact {
  type: DocumentationType;
  path: string;
  name: string;
  quality?: number;
}

export type DocumentationType =
  | "readme"
  | "srs"
  | "architecture"
  | "design"
  | "test_plan"
  | "test_case"
  | "test_report"
  | "changelog"
  | "license"
  | "contributing"
  | "api_docs"
  | "deployment"
  | "other";

export interface TestArtifact {
  type: TestType;
  path: string;
  name: string;
  framework?: string;
}

export type TestType =
  | "unit"
  | "integration"
  | "e2e"
  | "performance"
  | "security"
  | "test_config"
  | "test_data"
  | "coverage";

export interface ArchitecturePattern {
  name: string;
  confidence: number;
  evidence: string[];
}

export interface SecurityFinding {
  type: SecurityIssueType;
  severity: Severity;
  file: string;
  line?: number;
  description: string;
  evidence: string;
}

export type SecurityIssueType =
  | "hardcoded_secret"
  | "exposed_credentials"
  | "env_exposed"
  | "unsafe_code"
  | "sql_injection"
  | "xss_vulnerability"
  | "weak_crypto";

export interface HeuristicResult {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  passed: boolean;
  finding?: Finding;
}

export interface ScoringWeights {
  documentation: number;
  tests: number;
  architecture: number;
  standards: number;
  security: number;
  gitHygiene: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  documentation: 0.2,
  tests: 0.2,
  architecture: 0.2,
  standards: 0.2,
  security: 0.1,
  gitHygiene: 0.1,
};

export interface AnalyzerContext {
  scanResult: RepositoryScanResult;
  gitMetadata: GitMetadata;
  documentationArtifacts: DocumentationArtifact[];
  testArtifacts: TestArtifact[];
  securityFindings: SecurityFinding[];
  codeFiles: ScannedFile[];
  testFiles: ScannedFile[];
}

export type AnalyzerFn = (context: AnalyzerContext) => Finding[];
