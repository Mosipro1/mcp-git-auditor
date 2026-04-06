import { analyzeDocumentation } from "../src/analyzers/documentationAnalyzer";
import { ScannedFile } from "../src/types/auditTypes";

describe("documentationAnalyzer", () => {
  it("should return empty artifacts for no documentation files", () => {
    const files: ScannedFile[] = [];
    const result = analyzeDocumentation(files);

    expect(result.artifacts).toEqual([]);
    expect(result.score).toBe(0);
  });

  it("should detect README file", () => {
    const files: ScannedFile[] = [
      {
        path: "/repo/README.md",
        relativePath: "README.md",
        name: "README.md",
        extension: ".md",
        type: "markdown",
        size: 1000,
        isBinary: false,
      },
    ];

    const result = analyzeDocumentation(files);

    expect(result.artifacts).toContain("README.md");
    expect(result.score).toBeGreaterThan(0);
  });

  it("should detect multiple documentation types", () => {
    const files: ScannedFile[] = [
      {
        path: "/repo/README.md",
        relativePath: "README.md",
        name: "README.md",
        extension: ".md",
        type: "markdown",
        size: 1000,
        isBinary: false,
      },
      {
        path: "/repo/SRS.md",
        relativePath: "SRS.md",
        name: "SRS.md",
        extension: ".md",
        type: "markdown",
        size: 2000,
        isBinary: false,
      },
      {
        path: "/repo/architecture.md",
        relativePath: "docs/architecture.md",
        name: "architecture.md",
        extension: ".md",
        type: "markdown",
        size: 1500,
        isBinary: false,
      },
    ];

    const result = analyzeDocumentation(files);

    expect(result.artifacts.length).toBe(3);
    expect(result.findings.some((f) => f.id === "DOC-001")).toBe(false);
    expect(result.findings.some((f) => f.id === "DOC-002")).toBe(false);
  });

  it("should add findings for missing documentation", () => {
    const files: ScannedFile[] = [
      {
        path: "/repo/src/main.ts",
        relativePath: "src/main.ts",
        name: "main.ts",
        extension: ".ts",
        type: "typescript",
        size: 500,
        isBinary: false,
      },
    ];

    const result = analyzeDocumentation(files);

    expect(result.findings.some((f) => f.id === "DOC-001")).toBe(true);
    expect(result.findings.some((f) => f.id === "DOC-002")).toBe(true);
  });

  it("should calculate appropriate score based on documentation", () => {
    const files: ScannedFile[] = [
      {
        path: "/repo/README.md",
        relativePath: "README.md",
        name: "README.md",
        extension: ".md",
        type: "markdown",
        size: 1000,
        isBinary: false,
      },
      {
        path: "/repo/SRS.md",
        relativePath: "SRS.md",
        name: "SRS.md",
        extension: ".md",
        type: "markdown",
        size: 2000,
        isBinary: false,
      },
    ];

    const result = analyzeDocumentation(files);

    expect(result.score).toBeGreaterThanOrEqual(50);
  });
});
