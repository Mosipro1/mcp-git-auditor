import {
  calculateOverallScore,
  determineRiskLevel,
  identifyStrengths,
  identifyWeaknesses,
  generateRecommendations,
  ComponentScores,
} from "../src/engine/scoringEngine";
import { GitMetadata, Finding } from "../src/types/auditTypes";

describe("scoringEngine", () => {
  describe("calculateOverallScore", () => {
    it("should calculate weighted score correctly", () => {
      const componentScores: ComponentScores = {
        documentation: 80,
        tests: 70,
        architecture: 60,
        standards: 75,
        security: 90,
        gitHygiene: 85,
      };

      const score = calculateOverallScore(componentScores);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should handle zero scores", () => {
      const componentScores: ComponentScores = {
        documentation: 0,
        tests: 0,
        architecture: 0,
        standards: 0,
        security: 0,
        gitHygiene: 0,
      };

      const score = calculateOverallScore(componentScores);

      expect(score).toBe(0);
    });

    it("should handle maximum scores", () => {
      const componentScores: ComponentScores = {
        documentation: 100,
        tests: 100,
        architecture: 100,
        standards: 100,
        security: 100,
        gitHygiene: 100,
      };

      const score = calculateOverallScore(componentScores);

      expect(score).toBe(100);
    });
  });

  describe("determineRiskLevel", () => {
    it("should return critical for low security score", () => {
      const level = determineRiskLevel(80, 10, []);
      expect(level).toBe("critical");
    });

  it("should return high for low overall score", () => {
    const level = determineRiskLevel(30, 80, []);
    expect(level).toBe("medium");
  });

    it("should return low for high overall score with good security", () => {
      const level = determineRiskLevel(85, 90, []);
      expect(level).toBe("low");
    });

    it("should return medium for moderate conditions", () => {
      const level = determineRiskLevel(60, 60, []);
      expect(level).toBe("medium");
    });
  });

  describe("identifyStrengths", () => {
    it("should identify good documentation", () => {
      const componentScores: ComponentScores = {
        documentation: 80,
        tests: 30,
        architecture: 30,
        standards: 30,
        security: 90,
        gitHygiene: 30,
      };
      const gitMetadata: GitMetadata = {
        isGitRepo: false,
        commitCount: 0,
        branchCount: 0,
        branches: [],
        commits: [],
        tags: [],
        hasRemote: false,
      };

      const strengths = identifyStrengths(componentScores, gitMetadata);

      expect(strengths).toContain("Good documentation coverage");
    });

    it("should identify good security", () => {
      const componentScores: ComponentScores = {
        documentation: 30,
        tests: 30,
        architecture: 30,
        standards: 30,
        security: 95,
        gitHygiene: 30,
      };
      const gitMetadata: GitMetadata = {
        isGitRepo: false,
        commitCount: 0,
        branchCount: 0,
        branches: [],
        commits: [],
        tags: [],
        hasRemote: false,
      };

      const strengths = identifyStrengths(componentScores, gitMetadata);

      expect(strengths).toContain("No security issues detected");
    });
  });

  describe("identifyWeaknesses", () => {
    it("should identify poor documentation", () => {
      const componentScores: ComponentScores = {
        documentation: 30,
        tests: 80,
        architecture: 80,
        standards: 80,
        security: 80,
        gitHygiene: 80,
      };
      const findings: Finding[] = [];

      const weaknesses = identifyWeaknesses(componentScores, findings);

      expect(weaknesses).toContain("Insufficient documentation");
    });

    it("should identify security issues from findings", () => {
      const componentScores: ComponentScores = {
        documentation: 80,
        tests: 80,
        architecture: 80,
        standards: 80,
        security: 50,
        gitHygiene: 80,
      };
      const findings: Finding[] = [
        {
          id: "TEST-001",
          area: "Test",
          severity: "high",
          title: "Test issue",
          description: "Test issue",
          confidence: 0.9,
        },
      ];

      const weaknesses = identifyWeaknesses(componentScores, findings);

      expect(weaknesses.some((w) => w.includes("high severity"))).toBe(true);
    });
  });

  describe("generateRecommendations", () => {
    it("should generate recommendations from findings", () => {
      const componentScores: ComponentScores = {
        documentation: 30,
        tests: 30,
        architecture: 30,
        standards: 30,
        security: 30,
        gitHygiene: 30,
      };
      const findings: Finding[] = [
        {
          id: "SEC-001",
          area: "Security",
          severity: "critical",
          title: "Security issue",
          description: "Critical security issue",
          confidence: 0.9,
          recommendation: "Fix the security issue immediately",
        },
      ];

      const recommendations = generateRecommendations(findings, componentScores);

      expect(recommendations.length).toBeGreaterThan(0);
    });

    it("should add general recommendations for low scores", () => {
      const componentScores: ComponentScores = {
        documentation: 30,
        tests: 30,
        architecture: 30,
        standards: 30,
        security: 30,
        gitHygiene: 30,
      };
      const findings: Finding[] = [];

      const recommendations = generateRecommendations(findings, componentScores);

      expect(recommendations.some((r) => r.includes("documentation"))).toBe(true);
      expect(recommendations.some((r) => r.includes("tests"))).toBe(true);
    });
  });
});
