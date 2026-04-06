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

import * as fs from "fs/promises";
import * as path from "path";
import { RepositoryScanResult, ScannedFile, GitMetadata } from "../types/auditTypes";
import { scanFiles } from "./fileScanner";
import { scanGitMetadata } from "./gitScanner";

export interface RepoScannerOptions {
  includeBinary?: boolean;
  maxFileSize?: number;
  scanHidden?: boolean;
}

export async function scanRepository(
  repoPath: string,
  _options: RepoScannerOptions = {}
): Promise<RepositoryScanResult> {
  const resolvedPath = path.resolve(repoPath);

  const pathExists = await checkPathExists(resolvedPath);
  if (!pathExists) {
    throw new Error(`Repository path does not exist: ${resolvedPath}`);
  }

  const isDirectory = await checkIsDirectory(resolvedPath);
  if (!isDirectory) {
    throw new Error(`Repository path is not a directory: ${resolvedPath}`);
  }

  const files = await scanFiles(resolvedPath);
  
  const directories = extractDirectories(files);
  
  const ignoredPaths = await collectIgnoredPaths(resolvedPath);

  return {
    rootPath: resolvedPath,
    files,
    directories,
    ignoredPaths,
  };
}

async function checkPathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function checkIsDirectory(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

function extractDirectories(files: ScannedFile[]): string[] {
  const dirSet = new Set<string>();
  
  for (const file of files) {
    const parts = file.relativePath.split("/");
    for (let i = 1; i < parts.length; i++) {
      dirSet.add(parts.slice(0, i).join("/"));
    }
  }

  return Array.from(dirSet).sort();
}

async function collectIgnoredPaths(rootPath: string): Promise<string[]> {
  const ignored: string[] = [];
  
  const ignoredDirs = [
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    "out",
    "target",
  ];

  for (const dir of ignoredDirs) {
    const dirPath = path.join(rootPath, dir);
    try {
      const stat = await fs.stat(dirPath);
      if (stat.isDirectory()) {
        ignored.push(dir);
      }
    } catch {
    }
  }

  return ignored;
}

export async function scanFullRepository(
  repoPath: string
): Promise<{
  scanResult: RepositoryScanResult;
  gitMetadata: GitMetadata;
}> {
  const scanResult = await scanRepository(repoPath);
  const gitMetadata = await scanGitMetadata(repoPath);

  return {
    scanResult,
    gitMetadata,
  };
}
