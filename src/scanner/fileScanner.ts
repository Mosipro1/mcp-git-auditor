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
import { ScannedFile, FileType } from "../types/auditTypes";
import { shouldIgnorePath } from "./ignoreRules";
import { isTestFile as checkIsTestFile, isInTestDirectory } from "../utils/testDetection";
import { ScanLimits, checkFileSize } from "../utils/pathValidator";

const FILE_TYPE_EXTENSIONS: Record<FileType, string[]> = {
  typescript: [".ts", ".tsx"],
  javascript: [".js", ".jsx", ".mjs", ".cjs"],
  python: [".py"],
  java: [".java", ".kt", ".scala"],
  markdown: [".md", ".mdx"],
  json: [".json", ".jsonc"],
  yaml: [".yaml", ".yml"],
  xml: [".xml", ".xsl", ".xsd"],
  pdf: [".pdf"],
  docx: [".docx", ".doc"],
  other: [],
};

const BINARY_EXTENSIONS = new Set([
  ".pdf",
  ".docx",
  ".doc",
  ".xlsx",
  ".xls",
  ".pptx",
  ".ppt",
  ".zip",
  ".tar",
  ".gz",
  ".rar",
  ".7z",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".bmp",
  ".ico",
  ".svg",
  ".webp",
  ".mp3",
  ".wav",
  ".mp4",
  ".avi",
  ".mov",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
]);

export async function scanFiles(rootPath: string): Promise<ScannedFile[]> {
  const files: ScannedFile[] = [];
  const limits = new ScanLimits();

  async function scanDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(rootPath, fullPath);

        if (shouldIgnorePath(relativePath, entry.isDirectory())) {
          continue;
        }

        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          // Verificar límites antes de procesar
          const stats = await fs.stat(fullPath).catch(() => null);
          if (!stats) continue;

          const sizeCheck = checkFileSize(stats.size);
          if (!sizeCheck.allowed) {
            console.warn(`[SCAN SKIP] ${relativePath}: ${sizeCheck.reason}`);
            limits.addError(`Skipped ${relativePath}: ${sizeCheck.reason}`);
            continue;
          }

          const limitCheck = limits.addFile(stats.size);
          if (!limitCheck.allowed) {
            console.warn(`[SCAN LIMIT] ${limitCheck.reason}`);
            limits.addError(limitCheck.reason!);
            return; // Detener escaneo
          }

          const scannedFile = await createScannedFile(
            fullPath,
            relativePath,
            rootPath
          );
          if (scannedFile) {
            files.push(scannedFile);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}: ${error}`);
      limits.addError(`Directory scan failed: ${error}`);
    }
  }

  await scanDirectory(rootPath);

  // Log de estadísticas
  const stats = limits.getStats();
  console.log(`[SCAN] Files: ${stats.fileCount}, Total size: ${stats.totalSize} bytes`);

  return files;
}

export async function createScannedFile(
  fullPath: string,
  relativePath: string,
  _rootPath: string
): Promise<ScannedFile | null> {
  try {
    const stats = await fs.stat(fullPath);
    const name = path.basename(fullPath);
    const extension = path.extname(fullPath).toLowerCase();
    const isBinary = BINARY_EXTENSIONS.has(extension);

    const type = determineFileType(extension);

    return {
      path: fullPath,
      relativePath,
      name,
      extension,
      type,
      size: stats.size,
      isBinary,
    };
  } catch (error) {
    console.error(`Error creating scanned file for ${fullPath}: ${error}`);
    return null;
  }
}

export function determineFileType(extension: string): FileType {
  for (const [type, extensions] of Object.entries(FILE_TYPE_EXTENSIONS)) {
    if (extensions.includes(extension)) {
      return type as FileType;
    }
  }
  return "other";
}

export function isSourceFile(file: ScannedFile): boolean {
  return (
    file.type === "typescript" ||
    file.type === "javascript" ||
    file.type === "python" ||
    file.type === "java"
  );
}

export function isTestFile(file: ScannedFile): boolean {
  // Usar la función unificada del módulo de utilidades
  return checkIsTestFile(file.name) || isInTestDirectory(file.relativePath);
}

export function isDocumentationFile(file: ScannedFile): boolean {
  return (
    file.type === "markdown" ||
    file.type === "json" ||
    file.type === "yaml"
  ) &&
    !file.name.startsWith(".")
    ? true
    : false;
}

export async function readFileContent(
  filePath: string,
  maxSize: number = 1024 * 1024
): Promise<string | null> {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > maxSize) {
      return null;
    }

    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    return null;
  }
}

export function groupFilesByType(
  files: ScannedFile[]
): Record<string, ScannedFile[]> {
  const grouped: Record<string, ScannedFile[]> = {};

  for (const file of files) {
    const type = file.type;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(file);
  }

  return grouped;
}
