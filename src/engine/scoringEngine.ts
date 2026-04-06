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
  ScoringWeights,
  DEFAULT_SCORING_WEIGHTS,
  RiskLevel,
  Finding,
  GitMetadata,
} from "../types/auditTypes";

export interface ComponentScores {
  documentation: number;
  tests: number;
  architecture: number;
  standards: number;
  security: number;
  gitHygiene: number;
}

export function calculateOverallScore(
  componentScores: ComponentScores,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): number {
  const total =
    componentScores.documentation * weights.documentation +
    componentScores.tests * weights.tests +
    componentScores.architecture * weights.architecture +
    componentScores.standards * weights.standards +
    componentScores.security * weights.security +
    componentScores.gitHygiene * weights.gitHygiene;

  return Math.round(total);
}

export function determineRiskLevel(
  overallScore: number,
  securityScore: number,
  findings: Finding[]
): RiskLevel {
  const criticalFindings = findings.filter(
    (f) => f.severity === "critical"
  ).length;
  const highFindings = findings.filter((f) => f.severity === "high").length;
  const mediumFindings = findings.filter(
    (f) => f.severity === "medium"
  ).length;

  if (criticalFindings > 0 || securityScore < 20) {
    return "critical";
  }

  if (highFindings > 2 || securityScore < 50) {
    return "high";
  }

  if (overallScore < 40 || highFindings > 0 || securityScore < 70) {
    return "medium";
  }

  if (overallScore >= 70 && mediumFindings <= 2) {
    return "low";
  }

  return "medium";
}

export function identifyStrengths(
  componentScores: ComponentScores,
  gitMetadata: GitMetadata
): string[] {
  const strengths: string[] = [];

  if (componentScores.documentation >= 70) {
    strengths.push("Good documentation coverage");
  }
  if (componentScores.tests >= 70) {
    strengths.push("Comprehensive test coverage");
  }
  if (componentScores.architecture >= 70) {
    strengths.push("Well-structured code architecture");
  }
  if (componentScores.standards >= 70) {
    strengths.push("Strong standards compliance");
  }
  if (componentScores.security >= 90) {
    strengths.push("No security issues detected");
  }
  if (gitMetadata.isGitRepo && (gitMetadata.commitCount || 0) >= 10) {
    strengths.push("Active version control with meaningful commit history");
  }

  return strengths;
}

export function identifyWeaknesses(
  componentScores: ComponentScores,
  findings: Finding[]
): string[] {
  const weaknesses: string[] = [];

  if (componentScores.documentation < 40) {
    weaknesses.push("Insufficient documentation");
  }
  if (componentScores.tests < 40) {
    weaknesses.push("Inadequate test coverage");
  }
  if (componentScores.architecture < 40) {
    weaknesses.push("Poor code organization");
  }
  if (componentScores.standards < 40) {
    weaknesses.push("Low standards compliance");
  }
  if (componentScores.security < 60) {
    weaknesses.push("Security vulnerabilities present");
  }
  if (componentScores.gitHygiene < 40) {
    weaknesses.push("Poor git hygiene");
  }

  const severityCounts = {
    critical: findings.filter((f) => f.severity === "critical").length,
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
  };

  if (severityCounts.critical > 0) {
    weaknesses.push(`${severityCounts.critical} critical issues found`);
  }
  if (severityCounts.high > 0) {
    weaknesses.push(`${severityCounts.high} high severity issues found`);
  }

  return weaknesses;
}

export function generateRecommendations(
  findings: Finding[],
  componentScores: ComponentScores
): string[] {
  const recommendations: string[] = [];
  const addedRecommendations = new Set<string>();

  const criticalFindings = findings
    .filter((f) => f.severity === "critical")
    .filter((f) => f.recommendation);
  const highFindings = findings
    .filter((f) => f.severity === "high")
    .filter((f) => f.recommendation);

  for (const finding of [...criticalFindings, ...highFindings]) {
    if (finding.recommendation && !addedRecommendations.has(finding.recommendation)) {
      recommendations.push(finding.recommendation);
      addedRecommendations.add(finding.recommendation);
    }
  }

  if (componentScores.documentation < 50) {
    recommendations.push("Prioritize adding documentation (README, requirements, design docs)");
  }
  if (componentScores.tests < 50) {
    recommendations.push("Implement automated tests to improve code quality");
  }
  if (componentScores.architecture < 50) {
    recommendations.push("Refactor code to follow established architectural patterns");
  }

  return recommendations.slice(0, 10);
}

export function normalizeScore(score: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, score));
}
