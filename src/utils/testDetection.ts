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

/**
 * Utility for detecting test files across the codebase
 * Centralizes test file patterns to avoid duplication
 */

/**
 * Patterns that match test file names
 */
export const TEST_PATTERNS = [
  /\.test\.(ts|js|tsx|jsx|py|java|kt)$/,
  /\.spec\.(ts|js|tsx|jsx|py|java|kt)$/,
  /__tests__\/.*\.(ts|js|tsx|jsx|py|java|kt)$/,
  /tests?\/.*\.(ts|js|tsx|jsx|py|java|kt)$/,
  /^test_.*\.(ts|js|tsx|jsx|py|java|kt)$/,
  /^.*_test\.(ts|js|tsx|jsx|py|java|kt)$/,
  /\.(tests?)\.(ts|js|tsx|jsx|py|java|kt)$/,
  /Test\.(java|kt|py)$/, // Java/Kotlin/Python naming
];

/**
 * Framework configuration file patterns
 */
export const TEST_FRAMEWORK_CONFIGS = [
  { name: "jest", patterns: ["jest.config.js", "jest.config.ts", "jest.config.json"] },
  { name: "vitest", patterns: ["vitest.config.ts", "vitest.config.js", "vite.config.ts"] },
  { name: "mocha", patterns: [".mocharc.json", ".mocharc.js", "mocha.opts"] },
  { name: "jasmine", patterns: ["jasmine.json", "jasmine.config.json"] },
  { name: "pytest", patterns: ["pytest.ini", "setup.cfg", "pyproject.toml", "conftest.py"] },
  { name: "junit", patterns: ["junit.xml", "pom.xml", "build.gradle"] },
];

/**
 * Check if a file name matches test patterns
 * @param fileName - The file name to check
 * @returns true if the file is a test file
 */
export function isTestFile(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return TEST_PATTERNS.some((pattern) => pattern.test(lowerName));
}

/**
 * Check if a file path contains test directory patterns
 * @param relativePath - The relative file path
 * @returns true if the file is in a test directory
 */
export function isInTestDirectory(relativePath: string): boolean {
  const lowerPath = relativePath.toLowerCase();
  return (
    lowerPath.includes("/test/") ||
    lowerPath.includes("/tests/") ||
    lowerPath.includes("/__tests__/")
  );
}

/**
 * Detect test framework from configuration files
 * @param files - Array of file names to check
 * @returns The detected framework name or null
 */
export function detectTestFramework(files: { name: string }[]): string | null {
  for (const framework of TEST_FRAMEWORK_CONFIGS) {
    for (const pattern of framework.patterns) {
      const found = files.some(
        (f) => f.name.toLowerCase() === pattern.toLowerCase()
      );
      if (found) {
        return framework.name;
      }
    }
  }
  return null;
}

/**
 * Determine test type based on file path and name
 * @param relativePath - The relative file path
 * @param fileName - The file name
 * @returns The type of test
 */
export function detectTestType(
  relativePath: string,
  fileName: string
): "unit" | "integration" | "e2e" | "performance" | "security" | "test_config" | "test_data" | "coverage" {
  const lowerPath = relativePath.toLowerCase();
  const lowerName = fileName.toLowerCase();

  if (
    lowerPath.includes("integration") ||
    lowerName.includes("integration")
  ) {
    return "integration";
  }
  if (
    lowerPath.includes("e2e") ||
    lowerPath.includes("end-to-end") ||
    lowerName.includes("e2e")
  ) {
    return "e2e";
  }
  if (
    lowerPath.includes("performance") ||
    lowerName.includes("perf")
  ) {
    return "performance";
  }
  if (
    lowerPath.includes("security") ||
    lowerName.includes("security")
  ) {
    return "security";
  }
  if (
    lowerName.includes("config") ||
    lowerName.includes("setup") ||
    lowerName.includes("conftest") ||
    lowerName.includes("teardown")
  ) {
    return "test_config";
  }
  if (
    lowerPath.includes("fixtures") ||
    lowerPath.includes("__data__") ||
    lowerPath.includes("test-data")
  ) {
    return "test_data";
  }
  if (
    lowerPath.includes("coverage") ||
    lowerName.includes("coverage")
  ) {
    return "coverage";
  }

  return "unit";
}
