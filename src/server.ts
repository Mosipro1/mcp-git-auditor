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

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { scanFullRepository } from "./scanner/repoScanner";
import { generateAuditReport } from "./report/reportGenerator";
import { AuditReport } from "./types/auditTypes";
import { validateRepoPath, sanitizePathForOutput } from "./utils/pathValidator";
import { securityConfig } from "./config/securityConfig";

const server = new Server(
  {
    name: "mcp-git-auditor",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "audit_repository",
        description:
          "Audits a Git repository and evaluates its compliance with software engineering standards and quality practices. Scans for documentation, tests, architecture patterns, security issues, and produces a structured audit report.",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description:
                "Path to the repository to audit (absolute or relative path)",
            },
          },
          required: ["path"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "audit_repository") {
    try {
      const repoPath = args?.path as string | undefined;

      if (!repoPath || typeof repoPath !== "string") {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: {
                    code: "INVALID_PATH",
                    message: "Path parameter is required and must be a string",
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      // Validate path securely
      const validation = validateRepoPath(repoPath);
      if (!validation.valid) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  error: {
                    code: "PATH_VALIDATION_FAILED",
                    message: validation.error,
                  },
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }

      const resolvedPath = validation.resolvedPath!;

      // Safe logging (without exposing full paths)
      if (securityConfig.logLevel === 'debug') {
        console.log(`[AUDIT] Scanning: ${sanitizePathForOutput(resolvedPath)}`);
      }

      const { scanResult, gitMetadata } = await scanFullRepository(resolvedPath);
      const report = await generateAuditReport({ scanResult, gitMetadata });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(report, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      const errorReport: Partial<AuditReport> = {
        repository: sanitizePathForOutput(args?.path as string ?? "unknown"),
        scanDate: new Date().toISOString(),
        fileCount: 0,
        sourceFileCount: 0,
        testFileCount: 0,
        documentationFileCount: 0,
        summary: {
          overallScore: 0,
          riskLevel: "critical",
          keyStrengths: [],
          keyWeaknesses: ["Audit failed due to error"],
          recommendations: ["Check repository path and permissions"],
        },
        git: {
          commitCount: null,
          branchCount: null,
          commitQuality: {
            score: 0,
            findings: [],
          },
        },
        documentation: {
          score: 0,
          findings: [],
          artifacts: [],
        },
        tests: {
          score: 0,
          frameworkDetected: null,
          findings: [],
          artifacts: [],
        },
        architecture: {
          detectedPattern: null,
          modularityScore: 0,
          findings: [],
        },
        standards: {
          IEEE829: { compliant: false, score: 0, findings: [], missing: [], recommendations: [] },
          IEEE830: { compliant: false, score: 0, findings: [], missing: [], recommendations: [] },
          ISO25010: { compliant: false, score: 0, findings: [], missing: [], recommendations: [] },
          ISO12207: { compliant: false, score: 0, findings: [], missing: [], recommendations: [] },
        },
        security: {
          score: 0,
          findings: [],
          secretsDetected: false,
        },
        files: {
          byType: {},
          ignored: [],
          scanned: [],
        },
        errors: [
          {
            code: "AUDIT_ERROR",
            message: errorMessage,
            path: args?.path as string,
          },
        ],
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(errorReport, null, 2),
          },
        ],
      };
    }
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: "Unknown tool" }),
      },
    ],
    isError: true,
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
