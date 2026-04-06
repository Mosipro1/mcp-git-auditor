import { evaluateIEEE829 } from "../src/standards/ieee829";
import { evaluateIEEE830 } from "../src/standards/ieee830";
import { evaluateISO25010 } from "../src/standards/iso25010";
import { evaluateISO12207 } from "../src/standards/iso12207";
import { DocumentationArtifact, TestArtifact, ScannedFile } from "../src/types/auditTypes";

describe("IEEE 829 evaluation", () => {
  it("should return compliant when test artifacts exist", () => {
    const testArtifacts: TestArtifact[] = [
      { type: "unit", path: "test/main.test.ts", name: "main.test.ts" },
    ];
    const documentationArtifacts: DocumentationArtifact[] = [
      { type: "test_plan", path: "docs/test-plan.md", name: "test-plan.md" },
      { type: "test_case", path: "docs/test-cases.md", name: "test-cases.md" },
      { type: "test_report", path: "docs/test-report.md", name: "test-report.md" },
    ];

    const result = evaluateIEEE829(testArtifacts, documentationArtifacts);

    expect(result.compliant).toBe(true);
    expect(result.score).toBeGreaterThan(50);
  });

  it("should return non-compliant when no test documentation", () => {
    const testArtifacts: TestArtifact[] = [];
    const documentationArtifacts: DocumentationArtifact[] = [];

    const result = evaluateIEEE829(testArtifacts, documentationArtifacts);

    expect(result.compliant).toBe(false);
    expect(result.missing).toContain("Test Plan document");
    expect(result.missing).toContain("Test Case specifications");
  });
});

describe("IEEE 830 evaluation", () => {
  it("should return compliant when SRS exists", () => {
    const documentationArtifacts: DocumentationArtifact[] = [
      { type: "srs", path: "docs/SRS.md", name: "SRS.md" },
      { type: "readme", path: "README.md", name: "README.md" },
    ];

    const result = evaluateIEEE830(documentationArtifacts);

    expect(result.compliant).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(50);
  });

  it("should return non-compliant when no requirements docs", () => {
    const documentationArtifacts: DocumentationArtifact[] = [];

    const result = evaluateIEEE830(documentationArtifacts);

    expect(result.compliant).toBe(false);
    expect(result.missing).toContain("SRS (Software Requirements Specification)");
  });
});

describe("ISO 25010 evaluation", () => {
  it("should evaluate quality characteristics", () => {
    const files: ScannedFile[] = [
      {
        path: "/repo/src/main.ts",
        relativePath: "src/main.ts",
        name: "main.ts",
        extension: ".ts",
        type: "typescript",
        size: 1000,
        isBinary: false,
      },
      {
        path: "/repo/src/utils.ts",
        relativePath: "src/utils.ts",
        name: "utils.ts",
        extension: ".ts",
        type: "typescript",
        size: 800,
        isBinary: false,
      },
    ];
    const documentationArtifacts: DocumentationArtifact[] = [];
    const testArtifacts: TestArtifact[] = [
      { type: "unit", path: "test/main.test.ts", name: "main.test.ts" },
    ];

    const result = evaluateISO25010(files, documentationArtifacts, testArtifacts);

    expect(result.score).toBeGreaterThan(0);
  });
});

describe("ISO 12207 evaluation", () => {
  it("should evaluate lifecycle processes", () => {
    const documentationArtifacts: DocumentationArtifact[] = [
      { type: "srs", path: "docs/SRS.md", name: "SRS.md" },
      { type: "design", path: "docs/design.md", name: "design.md" },
      { type: "test_plan", path: "docs/test-plan.md", name: "test-plan.md" },
    ];
    const files: ScannedFile[] = [
      {
        path: "/repo/src/main.ts",
        relativePath: "src/main.ts",
        name: "main.ts",
        extension: ".ts",
        type: "typescript",
        size: 1000,
        isBinary: false,
      },
    ];

    const result = evaluateISO12207(documentationArtifacts, files);

    expect(result.score).toBeGreaterThan(50);
  });

  it("should identify missing lifecycle artifacts", () => {
    const documentationArtifacts: DocumentationArtifact[] = [];
    const files: ScannedFile[] = [];

    const result = evaluateISO12207(documentationArtifacts, files);

    expect(result.missing.length).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(50);
  });
});
