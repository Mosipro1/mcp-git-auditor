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

import { Finding, ArchitecturePattern, ScannedFile } from "../types/auditTypes";

interface ArchitectureIndicator {
  pattern: string;
  directories: string[];
  files: string[];
  minConfidence: number;
}

const ARCHITECTURE_INDICATORS: ArchitectureIndicator[] = [
  {
    pattern: "MVC",
    directories: ["models", "views", "controllers", "model", "view", "controller"],
    files: [],
    minConfidence: 0.6,
  },
  {
    pattern: "Clean Architecture",
    directories: [
      "domain",
      "application",
      "infrastructure",
      "entities",
      "use-cases",
      "usecases",
      "adapters",
      "interfaces",
    ],
    files: [],
    minConfidence: 0.5,
  },
  {
    pattern: "Hexagonal Architecture",
    directories: ["ports", "adapters", "core", "domain", "application"],
    files: [],
    minConfidence: 0.5,
  },
  {
    pattern: "Layered Architecture",
    directories: [
      "presentation",
      "business",
      "data",
      "domain",
      "layer",
      "ui",
      "service",
      "repository",
    ],
    files: [],
    minConfidence: 0.5,
  },
  {
    pattern: "DDD",
    directories: [
      "domain",
      "bounded-context",
      "aggregates",
      "entities",
      "value-objects",
      "domain-events",
      "services",
      "repositories",
    ],
    files: [],
    minConfidence: 0.6,
  },
  {
    pattern: "Feature-Based",
    directories: [
      "features",
      "modules",
      "components",
      "feature",
    ],
    files: [],
    minConfidence: 0.5,
  },
];

export function analyzeArchitecture(files: ScannedFile[], directories: string[]): {
  detectedPattern: string | null;
  modularityScore: number;
  findings: Finding[];
} {
  const findings: Finding[] = [];
  const sourceFiles = files.filter(
    (f) =>
      f.type === "typescript" ||
      f.type === "javascript" ||
      f.type === "python" ||
      f.type === "java"
  );

  const patterns = detectArchitecturePatterns(directories, sourceFiles);

  let detectedPattern: string | null = null;
  let highestConfidence = 0;

  for (const pattern of patterns) {
    if (pattern.confidence > highestConfidence) {
      highestConfidence = pattern.confidence;
      detectedPattern = pattern.name;
    }
  }

  const modularityScore = calculateModularityScore(files, directories);

  if (sourceFiles.length > 0 && detectedPattern === null) {
    findings.push({
      id: "ARCH-001",
      area: "Architecture",
      severity: "info",
      title: "No specific architecture pattern detected",
      description:
        "Repository does not follow a recognizable architectural pattern. Consider adopting a structured architecture like MVC, Clean Architecture, or DDD.",
      confidence: 0.5,
      recommendation: "Document the chosen architecture pattern and ensure consistent organization",
    });
  }

  if (modularityScore < 40) {
    findings.push({
      id: "ARCH-002",
      area: "Architecture",
      severity: "medium",
      title: "Low modularity detected",
      description:
        "Code organization shows low modularity. Files may be poorly organized or lack clear separation of concerns.",
      confidence: 0.7,
      recommendation: "Organize code into logical modules with clear responsibilities",
    });
  }

  if (sourceFiles.length > 50 && directories.length < 3) {
    findings.push({
      id: "ARCH-003",
      area: "Architecture",
      severity: "medium",
      title: "Flat directory structure with many source files",
      description:
        "Repository has many source files but few directories, suggesting potential organization issues.",
      confidence: 0.7,
      recommendation: "Consider organizing code into subdirectories by feature, layer, or domain",
    });
  }

  return {
    detectedPattern,
    modularityScore,
    findings,
  };
}

function detectArchitecturePatterns(
  directories: string[],
  _files: ScannedFile[]
): ArchitecturePattern[] {
  const results: ArchitecturePattern[] = [];
  const dirNames = directories.map((d) => d.split("/").pop() || "").filter(Boolean);

  for (const indicator of ARCHITECTURE_INDICATORS) {
    const matchedDirs: string[] = [];
    
    for (const dir of indicator.directories) {
      if (dirNames.some((d) => d.toLowerCase() === dir.toLowerCase())) {
        matchedDirs.push(dir);
      }
    }

    const matchRatio = matchedDirs.length / indicator.directories.length;
    const confidence = matchRatio * (matchedDirs.length > 0 ? 1 : 0);

    if (confidence >= indicator.minConfidence) {
      results.push({
        name: indicator.pattern,
        confidence: Math.min(confidence * 100, 100),
        evidence: matchedDirs,
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}

function calculateModularityScore(
  files: ScannedFile[],
  directories: string[]
): number {
  const sourceFiles = files.filter(
    (f) =>
      f.type === "typescript" ||
      f.type === "javascript" ||
      f.type === "python" ||
      f.type === "java"
  );

  if (sourceFiles.length === 0) {
    return 0;
  }

  const uniqueDirs = new Set(
    sourceFiles.map((f) => {
      const parts = f.relativePath.split("/");
      return parts.length > 1 ? parts[0] : "root";
    })
  );

  let score = 0;

  const dirCountScore = Math.min(uniqueDirs.size * 10, 40);
  score += dirCountScore;

  const sourcePerDir = sourceFiles.length / Math.max(uniqueDirs.size, 1);
  if (sourcePerDir <= 20) {
    score += 30;
  } else if (sourcePerDir <= 50) {
    score += 20;
  } else {
    score += 10;
  }

  const hasSrcDir = directories.some(
    (d) => d.startsWith("src") || d.startsWith("source") || d.startsWith("lib")
  );
  if (hasSrcDir) {
    score += 15;
  }

  const hasTestDir = directories.some(
    (d) => d.startsWith("test") || d.startsWith("tests")
  );
  if (hasTestDir) {
    score += 15;
  }

  return Math.min(score, 100);
}

export function getArchitectureFindings(
  files: ScannedFile[],
  directories: string[]
): Finding[] {
  const { findings } = analyzeArchitecture(files, directories);
  return findings;
}
