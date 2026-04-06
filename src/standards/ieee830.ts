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

import { StandardResult, Finding, DocumentationArtifact } from "../types/auditTypes";

export function evaluateIEEE830(
  documentationArtifacts: DocumentationArtifact[]
): StandardResult {
  const findings: Finding[] = [];
  const missing: string[] = [];
  const recommendations: string[] = [];

  const srsArtifact = documentationArtifacts.find(
    (d) => d.type === "srs" || d.name.toLowerCase().includes("requirements")
  );

  const readmeArtifact = documentationArtifacts.find(
    (d) => d.type === "readme"
  );

  const hasGlossary = documentationArtifacts.some(
    (d) =>
      d.name.toLowerCase().includes("glossary") ||
      d.name.toLowerCase().includes("vocabulary") ||
      d.name.toLowerCase().includes("terms")
  );

  const hasAcceptanceCriteria = documentationArtifacts.some(
    (d) =>
      d.name.toLowerCase().includes("acceptance") ||
      d.name.toLowerCase().includes("criteria") ||
      d.name.toLowerCase().includes("definition of done")
  );

  const hasNonFunctional = documentationArtifacts.some(
    (d) =>
      d.name.toLowerCase().includes("non-functional") ||
      d.name.toLowerCase().includes("nfr") ||
      d.name.toLowerCase().includes("performance") ||
      d.name.toLowerCase().includes("security") ||
      d.name.toLowerCase().includes("scalability")
  );

  if (!srsArtifact) {
    missing.push("SRS (Software Requirements Specification)");
    recommendations.push(
      "Create a formal SRS document following IEEE 830 template"
    );
  } else {
    findings.push({
      id: "IEEE830-001",
      area: "IEEE 830",
      severity: "info",
      title: "Requirements document present",
      description: `Found ${srsArtifact.name}`,
      confidence: 0.9,
    });
  }

  if (!readmeArtifact) {
    missing.push("Project overview (README)");
    recommendations.push(
      "Add a README with project overview and basic information"
    );
  } else {
    findings.push({
      id: "IEEE830-002",
      area: "IEEE 830",
      severity: "info",
      title: "Project overview present",
      description: "README file found",
      confidence: 0.9,
    });
  }

  if (!hasGlossary) {
    missing.push("Glossary/ Vocabulary");
    recommendations.push(
      "Add a glossary defining key terms, acronyms, and abbreviations"
    );
  }

  if (!hasAcceptanceCriteria) {
    missing.push("Acceptance Criteria");
    recommendations.push(
      "Document acceptance criteria for feature validation"
    );
  }

  if (!hasNonFunctional) {
    missing.push("Non-functional requirements");
    recommendations.push(
      "Include non-functional requirements (performance, security, scalability)"
    );
  }

  let score = 0;
  if (srsArtifact) score += 30;
  if (readmeArtifact) score += 20;
  if (hasGlossary) score += 15;
  if (hasAcceptanceCriteria) score += 20;
  if (hasNonFunctional) score += 15;

  const compliant = score >= 50;

  return {
    compliant,
    score,
    findings,
    missing,
    recommendations,
  };
}
