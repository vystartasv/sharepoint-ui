import { readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const bump = process.argv[2] ?? "patch";
const dryRun = process.argv.includes("--dry-run");
if (!["patch", "minor", "major"].includes(bump)) throw new Error("Usage: node scripts/bump-spfx-version.mjs [patch|minor|major] [--dry-run]");
const packagePath = resolve(root, "examples/spfx124-webpart/package.json");
const lockPath = resolve(root, "examples/spfx124-webpart/package-lock.json");
const solutionPath = resolve(root, "examples/spfx124-webpart/config/package-solution.json");
const [pkg, lock, solutionConfig, library] = await Promise.all([
  ...[packagePath, lockPath, solutionPath].map(async path => JSON.parse(await readFile(path, "utf8"))),
  readFile(resolve(root, "packages/sharepoint-ui/package.json"), "utf8").then(JSON.parse),
]);
const next = version => {
  const parts = version.split(".").map(Number);
  if (![3, 4].includes(parts.length) || parts.some(part => !Number.isInteger(part) || part < 0)) throw new Error(`Expected a stable three- or four-part version, received ${version}.`);
  const index = bump === "major" ? 0 : bump === "minor" ? 1 : parts.length - 1;
  parts[index]++;
  for (let i = index + 1; i < parts.length; i++) parts[i] = 0;
  return parts.join(".");
};
const packageVersion = next(pkg.version);
const solution = solutionConfig.solution;
if (!solution?.features?.length) throw new Error("The SPFx solution has no feature version to increment.");
pkg.version = packageVersion;
if (!lock.packages?.[""]) throw new Error("SPFx package lock is missing its root package record; run npm install before versioning.");
lock.version = packageVersion;
lock.packages[""].version = packageVersion;
solution.version = next(solution.version);
for (const feature of solution.features) feature.version = next(feature.version);
const updates = [[packagePath, pkg], [lockPath, lock], [solutionPath, solutionConfig]];
console.log(JSON.stringify({ dryRun, bump, libraryVersion: library.version, webPartVersion: packageVersion, solutionVersion: solution.version, featureVersions: solution.features.map(feature => feature.version) }, null, 2));
if (!dryRun) {
  const staged = [];
  try {
    for (const [path, value] of updates) {
      const temp = `${path}.tmp-${process.pid}`;
      await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`);
      staged.push([temp, path]);
    }
    for (const [temp, path] of staged) await rename(temp, path);
  } catch (error) {
    await Promise.all(staged.map(([temp]) => import("node:fs/promises").then(fs => fs.rm(temp, { force: true }))));
    throw error;
  }
}
