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

import { StandardResult, Finding, DocumentationArtifact, ScannedFile } from "../types/auditTypes";

export function evaluateISO12207(
  documentationArtifacts: DocumentationArtifact[],
  files: ScannedFile[]
): StandardResult {
  const findings: Finding[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];

  const hasRequirements = documentationArtifacts.some(
    (d) =>
      d.type === "srs" ||
      d.name.toLowerCase().includes("requirement") ||
      d.name.toLowerCase().includes("spec")
  );
  const hasDesign = documentationArtifacts.some(
    (d) =>
      d.type === "design" ||
      d.type === "architecture" ||
      d.name.toLowerCase().includes("design") ||
      d.name.toLowerCase().includes("architecture")
  );
  const hasImplementation = files.some(
    (f) =>
      f.type === "typescript" ||
      f.type === "javascript" ||
      f.type === "python" ||
      f.type === "java"
  );
  const hasVerification = documentationArtifacts.some(
    (d) =>
      d.type === "test_plan" ||
      d.type === "test_case" ||
      d.type === "test_report" ||
      d.name.toLowerCase().includes("test")
  );
  const hasMaintenance = documentationArtifacts.some(
    (d) =>
      d.name.toLowerCase().includes("maintenance") ||
      d.name.toLowerCase().includes("support") ||
      d.name.toLowerCase().includes("troubleshoot")
  );
  const hasRelease = documentationArtifacts.some(
    (d) =>
      d.name.toLowerCase().includes("release") ||
      d.name.toLowerCase().includes("version") ||
      d.name.toLowerCase().includes("changelog")
  );

  if (!hasRequirements) {
    missing.push("Requirements process artifacts");
    recommendations.push("Create requirements documentation (SRS, user stories)");
  } else {
    findings.push({
      id: "ISO12207-001",
      area: "ISO 12207",
      severity: "info",
      title: "Requirements artifacts present",
      description: "Found requirements-related documentation",
      confidence: 0.8,
    });
  }

  if (!hasDesign) {
    missing.push("Design artifacts");
    recommendations.push("Create design and architecture documentation");
  } else {
    findings.push({
      id: "ISO12207-002",
      area: "ISO 12207",
      severity: "info",
      title: "Design artifacts present",
      description: "Found design/architecture documentation",
      confidence: 0.8,
    });
  }

  if (!hasImplementation) {
    findings.push({
      id: "ISO12207-003",
      area: "ISO 12207",
      severity: "high",
      title: "No implementation artifacts found",
      description: "No source code files detected in repository",
      confidence: 0.9,
      recommendation: "Add source code implementation",
    });
    missing.push("Implementation artifacts");
  } else {
    findings.push({
      id: "ISO12207-004",
      area: "ISO 12207",
      severity: "info",
      title: "Implementation artifacts present",
      description: "Source code files found in repository",
      confidence: 0.9,
    });
  }

  if (!hasVerification) {
    missing.push("Verification process artifacts");
    recommendations.push("Add test documentation and verification evidence");
  }

  if (!hasMaintenance) {
    missing.push("Maintenance process artifacts");
    recommendations.push("Consider adding maintenance or support documentation");
  }

  if (!hasRelease) {
    missing.push("Release artifacts");
    recommendations.push("Add release notes or changelog");
  }

  let score = 0;
  if (hasRequirements) score += 20;
  if (hasDesign) score += 20;
  if (hasImplementation) score += 20;
  if (hasVerification) score += 20;
  if (hasMaintenance) score += 10;
  if (hasRelease) score += 10;

  const compliant = score >= 60;

  return {
    compliant,
    score: Math.min(score, 100),
    findings,
    missing,
    recommendations,
  };
}
