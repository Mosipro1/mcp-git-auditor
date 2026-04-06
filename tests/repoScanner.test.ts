import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { scanRepository } from "../src/scanner/repoScanner";
import { shouldIgnorePath } from "../src/scanner/ignoreRules";

describe("repoScanner", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "audit-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should scan an empty directory", async () => {
    const result = await scanRepository(tempDir);
    expect(result.rootPath).toBe(tempDir);
    expect(result.files).toEqual([]);
    expect(result.directories).toEqual([]);
  });

  it("should scan files correctly", async () => {
    await fs.writeFile(path.join(tempDir, "test.ts"), "const x = 1;");
    await fs.writeFile(path.join(tempDir, "test.js"), "const y = 2;");

    const result = await scanRepository(tempDir);
    expect(result.files.length).toBe(2);
  });

  it("should ignore node_modules", async () => {
    const nodeModulesDir = path.join(tempDir, "node_modules");
    await fs.mkdir(nodeModulesDir);
    await fs.writeFile(path.join(nodeModulesDir, "package.js"), "export {}");

    const result = await scanRepository(tempDir);
    expect(result.ignoredPaths).toContain("node_modules");
  });

  it("should detect .git directory as ignored", async () => {
    const gitDir = path.join(tempDir, ".git");
    await fs.mkdir(gitDir);
    await fs.writeFile(path.join(gitDir, "config"), "");

    const result = await scanRepository(tempDir);
    expect(result.ignoredPaths).toContain(".git");
  });
});

describe("ignoreRules", () => {
  it("should ignore node_modules", () => {
    expect(shouldIgnorePath("node_modules", true)).toBe(true);
    expect(shouldIgnorePath("node_modules/some/package", true)).toBe(true);
  });

  it("should ignore .git directory", () => {
    expect(shouldIgnorePath(".git", true)).toBe(true);
    expect(shouldIgnorePath(".git/objects", true)).toBe(true);
  });

  it("should ignore dist directory", () => {
    expect(shouldIgnorePath("dist", true)).toBe(true);
    expect(shouldIgnorePath("dist/build", true)).toBe(true);
  });

  it("should not ignore normal directories", () => {
    expect(shouldIgnorePath("src", true)).toBe(false);
    expect(shouldIgnorePath("lib", true)).toBe(false);
    expect(shouldIgnorePath("test", true)).toBe(false);
  });

  it("should ignore hidden files and directories", () => {
    expect(shouldIgnorePath(".env", false)).toBe(true);
    expect(shouldIgnorePath(".vscode", true)).toBe(true);
    expect(shouldIgnorePath(".DS_Store", false)).toBe(true);
  });

  it("should ignore files with lock extensions", () => {
    expect(shouldIgnorePath(".DS_Store", false)).toBe(true);
    expect(shouldIgnorePath("Thumbs.db", false)).toBe(true);
  });
});
