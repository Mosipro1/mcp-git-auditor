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

export const IGNORED_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  "out",
  "target",
  "__pycache__",
  ".pytest_cache",
  "venv",
  ".venv",
  "env",
  ".env",
  ".svn",
  ".hg",
  "bower_components",
  "vendor",
  "packages",
  ".idea",
  ".vscode",
];

export const IGNORED_FILES = [
  ".DS_Store",
  "Thumbs.db",
  "desktop.ini",
  ".gitignore",
  ".gitattributes",
  ".editorconfig",
];

export const IGNORED_EXTENSIONS = [
  ".lock",
  ".map",
  ".min.js",
  ".min.css",
  ".d.ts",
  ".d.tsx",
];

export interface IgnoreRule {
  pattern: string;
  type: "prefix" | "exact" | "extension";
}

export const IGNORE_RULES: IgnoreRule[] = [
  ...IGNORED_DIRS.map((d) => ({ pattern: d, type: "prefix" as const })),
  ...IGNORED_FILES.map((f) => ({ pattern: f, type: "exact" as const })),
  ...IGNORED_EXTENSIONS.map((e) => ({ pattern: e, type: "extension" as const })),
];

export function shouldIgnorePath(path: string, isDirectory: boolean): boolean {
  const parts = path.split("/");
  const name = parts[parts.length - 1];
  
  if (isDirectory && name.startsWith(".")) {
    return true;
  }

  for (const part of parts) {
    if (IGNORED_DIRS.includes(part)) {
      return true;
    }
  }

  if (!isDirectory) {
    if (IGNORED_FILES.includes(name)) {
      return true;
    }
    for (const ext of IGNORED_EXTENSIONS) {
      if (name.endsWith(ext)) {
        return true;
      }
    }
  }

  return false;
}
