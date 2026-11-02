import { execFileSync } from "node:child_process";
import { cp, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "docs-site/dist");
const checkout = await mkdtemp(resolve(tmpdir(), "sharepoint-ui-docs-"));
const run = (command, args) => execFileSync(command, args, { cwd: checkout, stdio: "inherit" });

try {
  run("git", ["clone", "--depth", "1", "--branch", "main", "git@github.com:vystartasv/sharepoint-ui-docs.git", checkout]);
  for (const name of await readdir(checkout)) {
    if (![".git", ".github", ".nojekyll", "README.md"].includes(name)) {
      await rm(resolve(checkout, name), { recursive: true, force: true });
    }
  }
  await cp(dist, checkout, { recursive: true });
  run("git", ["add", "--all"]);
  const changed = execFileSync("git", ["status", "--porcelain"], { cwd: checkout, encoding: "utf8" }).trim().length > 0;
  if (!changed) {
    console.log("Docs site is already current; nothing to publish.");
  } else {
    run("git", ["commit", "-m", "Publish SharePoint UI docs site"]);
    run("git", ["push", "origin", "main"]);
  }
} finally {
  await rm(checkout, { recursive: true, force: true });
}
