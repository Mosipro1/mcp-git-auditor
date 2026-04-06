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
  StandardResult,
  TestArtifact,
  DocumentationArtifact,
  ScannedFile,
  Finding,
} from "../types/auditTypes";
import { evaluateIEEE829 } from "../standards/ieee829";
import { evaluateIEEE830 } from "../standards/ieee830";
import { evaluateISO25010 } from "../standards/iso25010";
import { evaluateISO12207 } from "../standards/iso12207";

export interface ComplianceContext {
  files: ScannedFile[];
  testArtifacts: TestArtifact[];
  documentationArtifacts: DocumentationArtifact[];
}

export function runComplianceChecks(context: ComplianceContext): {
  IEEE829: StandardResult;
  IEEE830: StandardResult;
  ISO25010: StandardResult;
  ISO12207: StandardResult;
} {
  const IEEE829 = evaluateIEEE829(context.testArtifacts, context.documentationArtifacts);
  const IEEE830 = evaluateIEEE830(context.documentationArtifacts);
  const ISO25010 = evaluateISO25010(
    context.files,
    context.documentationArtifacts,
    context.testArtifacts
  );
  const ISO12207 = evaluateISO12207(context.documentationArtifacts, context.files);

  return {
    IEEE829,
    IEEE830,
    ISO25010,
    ISO12207,
  };
}

export function calculateStandardsScore(
  standards: {
    IEEE829: StandardResult;
    IEEE830: StandardResult;
    ISO25010: StandardResult;
    ISO12207: StandardResult;
  },
  weights: { IEEE829: number; IEEE830: number; ISO25010: number; ISO12207: number } = {
    IEEE829: 0.25,
    IEEE830: 0.25,
    ISO25010: 0.25,
    ISO12207: 0.25,
  }
): number {
  const totalScore =
    standards.IEEE829.score * weights.IEEE829 +
    standards.IEEE830.score * weights.IEEE830 +
    standards.ISO25010.score * weights.ISO25010 +
    standards.ISO12207.score * weights.ISO12207;

  return Math.round(totalScore);
}

export function aggregateStandardsFindings(
  standards: {
    IEEE829: StandardResult;
    IEEE830: StandardResult;
    ISO25010: StandardResult;
    ISO12207: StandardResult;
  }
): Finding[] {
  const allFindings: Finding[] = [];

  allFindings.push(...standards.IEEE829.findings);
  allFindings.push(...standards.IEEE830.findings);
  allFindings.push(...standards.ISO25010.findings);
  allFindings.push(...standards.ISO12207.findings);

  return allFindings;
}
