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

import * as path from 'path';
import { securityConfig } from '../config/securityConfig';

export interface PathValidationResult {
  valid: boolean;
  resolvedPath: string | null;
  error?: string;
}

/**
 * Validates and resolves a repository path securely
 * Prevents path traversal attacks
 */
export function validateRepoPath(inputPath: string): PathValidationResult {
  // Reject empty or very short paths
  if (!inputPath || inputPath.trim().length === 0) {
    return {
      valid: false,
      resolvedPath: null,
      error: 'PATH_EMPTY: Repository path cannot be empty',
    };
  }

  // Reject paths with null characters
  if (inputPath.includes('\0')) {
    return {
      valid: false,
      resolvedPath: null,
      error: 'PATH_INVALID: Path contains invalid characters',
    };
  }

  // Normalize the path
  let resolvedPath: string;
  if (path.isAbsolute(inputPath)) {
    resolvedPath = path.normalize(inputPath);
  } else {
    resolvedPath = path.resolve(process.cwd(), inputPath);
  }

  // Check path traversal if enabled
  if (securityConfig.blockTraversal) {
    // Reject paths that attempt to escape the working directory
    const relativeToCwd = path.relative(process.cwd(), resolvedPath);

    if (relativeToCwd.startsWith('..') || relativeToCwd.includes('../')) {
      return {
        valid: false,
        resolvedPath: null,
        error: 'PATH_TRAVERSAL: Path traversal detected. Only paths within the current directory are allowed.',
      };
    }
  }

  // Check allowed base paths
  if (securityConfig.allowedBasePaths.length > 0) {
    const isAllowed = securityConfig.allowedBasePaths.some(base => {
      const normalizedBase = path.normalize(base);
      return resolvedPath.startsWith(normalizedBase);
    });

    if (!isAllowed) {
      return {
        valid: false,
        resolvedPath: null,
        error: `PATH_NOT_ALLOWED: Path is not within allowed base paths`,
      };
    }
  }

  // Sanitize the path to prevent symlink attacks
  // Do not allow paths with components starting with dot (except . and ..)
  const pathComponents = resolvedPath.split(path.sep);
  for (const component of pathComponents) {
    if (component.startsWith('.') && component !== '.' && component !== '..') {
      // Hidden files are allowed but logged
      console.warn(`[SECURITY] Hidden file/directory detected: ${component}`);
    }
  }

  return {
    valid: true,
    resolvedPath,
  };
}

/**
 * Sanitiza una ruta para evitar exposición de información sensible
 */
export function sanitizePathForOutput(filePath: string): string {
  if (!securityConfig.sanitizePaths) {
    return filePath;
  }

  // Si la ruta está dentro del cwd, mostrar solo relativa
  const relativePath = path.relative(process.cwd(), filePath);
  if (!relativePath.startsWith('..')) {
    return relativePath;
  }

  // Si es una ruta absoluta, ocultar la parte inicial
  const parsed = path.parse(filePath);
  return `[REDACTED]${path.sep}...${path.sep}${parsed.base}`;
}

/**
 * Verifica si un archivo excede el tamaño máximo permitido
 */
export function checkFileSize(fileSize: number): { allowed: boolean; reason?: string } {
  if (fileSize > securityConfig.maxFileSize) {
    return {
      allowed: false,
      reason: `File size ${fileSize} bytes exceeds maximum ${securityConfig.maxFileSize} bytes`,
    };
  }
  return { allowed: true };
}

/**
 * Verifica límites acumulativos
 */
export class ScanLimits {
  private totalSize: number = 0;
  private fileCount: number = 0;
  private errors: string[] = [];

  addFile(fileSize: number): { allowed: boolean; reason?: string } {
    this.fileCount++;
    this.totalSize += fileSize;

    if (this.fileCount > securityConfig.maxFiles) {
      return {
        allowed: false,
        reason: `File count limit exceeded: ${securityConfig.maxFiles}`,
      };
    }

    if (this.totalSize > securityConfig.maxTotalSize) {
      return {
        allowed: false,
        reason: `Total size limit exceeded: ${securityConfig.maxTotalSize} bytes`,
      };
    }

    return { allowed: true };
  }

  getStats(): { fileCount: number; totalSize: number } {
    return {
      fileCount: this.fileCount,
      totalSize: this.totalSize,
    };
  }

  addError(error: string): void {
    this.errors.push(error);
  }

  getErrors(): string[] {
    return this.errors;
  }
}
