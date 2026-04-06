/**
 * Security configuration for the MCP
 * Default values with environment variable override options
 */

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

export interface SecurityConfig {
  // File limits
  maxFileSize: number;          // bytes
  maxTotalSize: number;         // bytes
  maxFiles: number;             // maximum number of files

  // Timeouts
  scanTimeoutMs: number;        // total scan timeout
  gitTimeoutMs: number;         // git operations timeout
  fileReadTimeoutMs: number;    // file read timeout

  // Git limits
  maxCommits: number;           // maximum commits to analyze
  maxBranches: number;          // maximum branches to analyze

  // Path validation
  allowedBasePaths: string[];   // allowed base paths (empty = any)
  blockTraversal: boolean;      // block path traversal attacks

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  sanitizePaths: boolean;       // hide absolute paths in output
}

// Default values
const DEFAULT_CONFIG: SecurityConfig = {
  maxFileSize: 10 * 1024 * 1024,      // 10MB
  maxTotalSize: 1024 * 1024 * 1024,   // 1GB
  maxFiles: 10000,

  scanTimeoutMs: 5 * 60 * 1000,       // 5 minutos
  gitTimeoutMs: 30 * 1000,            // 30 segundos
  fileReadTimeoutMs: 5 * 1000,        // 5 segundos

  maxCommits: 5000,
  maxBranches: 100,

  allowedBasePaths: [],
  blockTraversal: true,

  logLevel: 'info',
  sanitizePaths: true,
};

function parseEnvInt(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

function parseEnvStringArray(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

export function loadSecurityConfig(): SecurityConfig {
  return {
    maxFileSize: parseEnvInt(process.env.MAX_FILE_SIZE, DEFAULT_CONFIG.maxFileSize),
    maxTotalSize: parseEnvInt(process.env.MAX_TOTAL_SIZE, DEFAULT_CONFIG.maxTotalSize),
    maxFiles: parseEnvInt(process.env.MAX_FILES, DEFAULT_CONFIG.maxFiles),

    scanTimeoutMs: parseEnvInt(process.env.SCAN_TIMEOUT_MS, DEFAULT_CONFIG.scanTimeoutMs),
    gitTimeoutMs: parseEnvInt(process.env.GIT_TIMEOUT_MS, DEFAULT_CONFIG.gitTimeoutMs),
    fileReadTimeoutMs: parseEnvInt(process.env.FILE_READ_TIMEOUT_MS, DEFAULT_CONFIG.fileReadTimeoutMs),

    maxCommits: parseEnvInt(process.env.MAX_COMMITS, DEFAULT_CONFIG.maxCommits),
    maxBranches: parseEnvInt(process.env.MAX_BRANCHES, DEFAULT_CONFIG.maxBranches),

    allowedBasePaths: parseEnvStringArray(process.env.ALLOWED_BASE_PATHS),
    blockTraversal: parseEnvBool(process.env.BLOCK_PATH_TRAVERSAL, DEFAULT_CONFIG.blockTraversal),

    logLevel: (process.env.LOG_LEVEL as SecurityConfig['logLevel']) || DEFAULT_CONFIG.logLevel,
    sanitizePaths: parseEnvBool(process.env.SANITIZE_PATHS, DEFAULT_CONFIG.sanitizePaths),
  };
}

// Singleton config
export const securityConfig = loadSecurityConfig();
