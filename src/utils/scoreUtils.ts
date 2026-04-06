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

export function normalizeTo100(value: number, max: number = 100): number {
  if (max === 0) return 0;
  return Math.round(Math.min(100, Math.max(0, (value / max) * 100)));
}

export function average(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round(sum / scores.length);
}

export function weightedAverage(
  values: number[],
  weights: number[]
): number {
  if (values.length !== weights.length || values.length === 0) {
    return 0;
  }

  const totalWeight = weights.reduce((acc, w) => acc + w, 0);
  if (totalWeight === 0) return 0;

  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * weights[i];
  }

  return Math.round(sum / totalWeight);
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function scaleScore(
  score: number,
  fromMin: number = 0,
  fromMax: number = 100,
  toMin: number = 0,
  toMax: number = 100
): number {
  if (fromMax === fromMin) return toMin;
  
  const normalized = (score - fromMin) / (fromMax - fromMin);
  return Math.round(normalized * (toMax - toMin) + toMin);
}

export function calculateRiskScore(
  severityWeights: Record<string, number>,
  findings: { severity: string }[]
): number {
  let score = 100;

  for (const finding of findings) {
    const weight = severityWeights[finding.severity] || 0;
    score -= weight;
  }

  return Math.max(0, score);
}

export const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 30,
  high: 20,
  medium: 10,
  low: 5,
  info: 0,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function roundToDecimal(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
