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

import simpleGit, { SimpleGit, LogResult } from "simple-git";
import { GitMetadata, GitCommit } from "../types/auditTypes";
import * as fs from "fs/promises";
import * as path from "path";
import { securityConfig } from "../config/securityConfig";

export async function scanGitMetadata(rootPath: string): Promise<GitMetadata> {
  const gitDir = path.join(rootPath, ".git");
  
  let isGitRepo = false;
  try {
    await fs.access(gitDir);
    isGitRepo = true;
  } catch {
    return createEmptyGitMetadata();
  }

  if (!isGitRepo) {
    return createEmptyGitMetadata();
  }

  const git: SimpleGit = simpleGit(rootPath);

  try {
    // Usar Promise.allSettled para no fallar completamente si una operación falla
    const results = await Promise.allSettled([
      getCommitCount(git),
      getBranchCount(git),
      git.branchLocal(),
      getCommits(git),
      git.tags(),
      git.getRemotes(true),
    ]);

    // Extraer resultados o usar valores por defecto si fallaron
    const commitCount = results[0].status === 'fulfilled' ? results[0].value : null;
    const branchCount = results[1].status === 'fulfilled' ? results[1].value : null;
    const branches = results[2].status === 'fulfilled' ? results[2].value : { all: [] };
    const commits = results[3].status === 'fulfilled' ? results[3].value : [];
    const tags = results[4].status === 'fulfilled' ? results[4].value : { all: [] };
    const remotes = results[5].status === 'fulfilled' ? results[5].value : [];

    // Log de errores individuales
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(`[GIT SCAN] Operation ${index} failed: ${result.reason}`);
      }
    });

    return {
      isGitRepo: true,
      commitCount,
      branchCount,
      branches: branches.all || [],
      commits,
      tags: tags.all || [],
      hasRemote: remotes.length > 0,
    };
  } catch (error) {
    console.error(`Error scanning git metadata: ${error}`);
    return createEmptyGitMetadata();
  }
}

async function getCommitCount(git: SimpleGit): Promise<number | null> {
  try {
    // Intentar obtener log, puede fallar si no hay commits
    const log = await git.log({ maxCount: 1 });
    if (!log.latest) {
      // Repo existe pero sin commits
      return 0;
    }

    // Si hay commits, obtener hasta el máximo configurado
    const maxCommits = securityConfig.maxCommits;
    const all = await git.log({ "--all": null, maxCount: maxCommits });
    return all.all.length;
  } catch (error) {
    // Error típico: "your current branch 'master' does not have any commits yet"
    const errorMessage = String(error).toLowerCase();
    if (
      errorMessage.includes("does not have any commits") ||
      errorMessage.includes("no commits yet") ||
      errorMessage.includes("doesn't have any commits") ||
      errorMessage.includes("fatal: bad default revision")
    ) {
      return 0;
    }
    return null;
  }
}

async function getBranchCount(git: SimpleGit): Promise<number | null> {
  try {
    const branches = await git.branchLocal();
    return branches.all.length;
  } catch {
    return null;
  }
}

async function getCommits(git: SimpleGit, maxCount: number = 100): Promise<GitCommit[]> {
  try {
    const log: LogResult = await git.log({ maxCount });

    // Si no hay commits, log.all estará vacío
    if (!log.all || log.all.length === 0) {
      return [];
    }

    return log.all.map((commit) => ({
      hash: commit.hash,
      date: new Date(commit.date),
      message: commit.message,
      author: commit.author_name,
    }));
  } catch (error) {
    // Error típico en repos sin commits
    const errorMessage = String(error).toLowerCase();
    if (
      errorMessage.includes("does not have any commits") ||
      errorMessage.includes("no commits yet") ||
      errorMessage.includes("bad default revision")
    ) {
      return [];
    }
    return [];
  }
}

function createEmptyGitMetadata(): GitMetadata {
  return {
    isGitRepo: false,
    commitCount: null,
    branchCount: null,
    branches: [],
    commits: [],
    tags: [],
    hasRemote: false,
  };
}

export function analyzeCommitQuality(commits: GitCommit[]): {
  score: number;
  findings: string[];
  hasMeaningfulMessages: boolean;
  hasReasonableFrequency: boolean;
  hasIterativeHistory: boolean;
} {
  const findings: string[] = [];
  
  if (commits.length === 0) {
    findings.push("No commits found in repository");
    return {
      score: 0,
      findings,
      hasMeaningfulMessages: false,
      hasReasonableFrequency: false,
      hasIterativeHistory: false,
    };
  }

  const meaningfulPatterns = [
    /^[A-Z]/,
    /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)/i,
  ];

  let meaningfulCount = 0;
  for (const commit of commits) {
    const firstLine = commit.message.split("\n")[0].trim();
    if (meaningfulPatterns.some((pattern) => pattern.test(firstLine))) {
      meaningfulCount++;
    }
  }

  const meaningfulRatio = meaningfulCount / commits.length;
  const hasMeaningfulMessages = meaningfulRatio >= 0.3;

  let hasReasonableFrequency = false;
  if (commits.length >= 5) {
    const dates = commits
      .map((c) => c.date.getTime())
      .sort((a, b) => a - b);
    
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const daySpan = (lastDate - firstDate) / (1000 * 60 * 60 * 24);
    
    if (daySpan > 0) {
      const commitsPerDay = commits.length / daySpan;
      hasReasonableFrequency = commitsPerDay >= 0.1 && commitsPerDay <= 50;
    }
  }

  const hasIterativeHistory = commits.length >= 3;

  let score = 0;
  if (hasMeaningfulMessages) score += 40;
  if (hasReasonableFrequency) score += 30;
  if (hasIterativeHistory) score += 30;

  if (!hasMeaningfulMessages) {
    findings.push("Many commits lack conventional commit message format");
  }
  if (!hasReasonableFrequency) {
    findings.push("Commit frequency appears abnormal (too sparse or too dense)");
  }
  if (!hasIterativeHistory) {
    findings.push("Limited commit history - suggests early-stage or minimal development");
  }

  return {
    score,
    findings,
    hasMeaningfulMessages,
    hasReasonableFrequency,
    hasIterativeHistory,
  };
}

export function getBranchNamingPattern(branches: string[]): {
  pattern: string | null;
  isConventional: boolean;
} {
  if (branches.length === 0) {
    return { pattern: null, isConventional: false };
  }

  const conventionalPrefixes = [
    "main",
    "master",
    "develop",
    "development",
    "feature/",
    "fix/",
    "bugfix/",
    "hotfix/",
    "release/",
    "refactor/",
  ];

  let matchingPrefixes = 0;
  for (const branch of branches) {
    const cleanBranch = branch.replace(/^remotes\/[^/]+\//, "");
    if (conventionalPrefixes.some((p) => cleanBranch.startsWith(p))) {
      matchingPrefixes++;
    }
  }

  const ratio = matchingPrefixes / branches.length;
  const isConventional = ratio >= 0.5;

  return {
    pattern: isConventional ? "conventional" : "non-conventional",
    isConventional,
  };
}
