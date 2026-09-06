import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = join(root, "dist/cli.js");
const run = (args, input) =>
  spawnSync(process.execPath, [cli, ...args], {
    encoding: "utf8",
    input,
    cwd: root,
    timeout: 10000,
  });

test("CLI init, stdin validation, inspection, decision, and manifest export work together", () => {
  const init = run(["init", "Review my app.", "--id", "cli-test"]);
  assert.equal(init.status, 0, init.stderr);
  assert.equal(JSON.parse(init.stdout).items[0].text, "Review my app.");
  assert.equal(run(["validate", "-"], init.stdout).status, 0);
  const example = join(root, "examples/review.task.json");
  const inspect = run(["inspect", example, "--step", "execute"]);
  assert.equal(JSON.parse(inspect.stdout).blocked, true);
  const decision = run([
    "decide",
    example,
    "findings-list",
    "confirm",
    "--reason",
    "Use the list.",
  ]);
  assert.equal(decision.status, 0, decision.stderr);
  const changed = JSON.parse(decision.stdout);
  assert.equal(changed.revision, 3);
  const render = run(["render", "-", "--json"], decision.stdout);
  assert.equal(render.status, 0, render.stderr);
  assert.equal(JSON.parse(render.stdout).manifest.revision, 3);
});

test("validity and readiness have separate exit behavior; blocked exports create no file", () => {
  const folder = mkdtempSync(join(tmpdir(), "intentacle-blocked-"));
  try {
    const example = join(root, "fixtures/cases/02-missing-app.json");
    assert.equal(run(["validate", example]).status, 0);
    assert.equal(run(["render", example]).status, 0);
    const out = join(folder, "blocked.md");
    const result = run(["render", example, "--require-ready", "--out", out]);
    assert.equal(result.status, 3);
    assert.equal(result.stdout, "");
    assert.equal(existsSync(out), false);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("output refuses overwrite, including writing a decision back to its source", () => {
  const folder = mkdtempSync(join(tmpdir(), "intentacle-files-"));
  try {
    const out = join(folder, "task.json");
    assert.equal(run(["init", "Review my app.", "--out", out]).status, 0);
    const before = readFileSync(out, "utf8");
    const result = run([
      "decide",
      out,
      "objective-1",
      "confirm",
      "--reason",
      "Yes.",
      "--out",
      out,
    ]);
    assert.equal(result.status, 2);
    assert.equal(readFileSync(out, "utf8"), before);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("malformed, oversized, and missing inputs fail with diagnostics", () => {
  assert.equal(run(["validate", "-"], "{oops").status, 2);
  assert.equal(run(["validate", "-"], " ".repeat(1024 * 1024 + 1)).status, 2);
  assert.equal(run(["validate", "absent-task.json"]).status, 2);
  assert.equal(
    run(["inspect", "examples/review.task.json", "--step", "oops"]).status,
    2,
  );
  assert.equal(
    run(["validate", "examples/review.task.json", "--json"]).status,
    2,
  );
  assert.equal(run(["init", "Review it.", "extra"]).status, 2);
  assert.equal(run(["__proto__", "task.json"]).status, 2);
  const invalid = run(["validate", "-"], "{}");
  assert.equal(invalid.status, 2);
  assert.equal(JSON.parse(invalid.stdout).valid, false);
  const folder = mkdtempSync(join(tmpdir(), "intentacle-large-"));
  try {
    const file = join(folder, "large.json");
    writeFileSync(file, " ".repeat(1024 * 1024 + 1));
    assert.equal(run(["validate", file]).status, 2);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});

test("help and version describe the installed build", () => {
  assert.match(run(["--help"]).stdout, /does not run AI extraction/);
  const version = run(["--version"]);
  assert.equal(version.status, 0, version.stderr);
  assert.equal(
    version.stdout.trim(),
    JSON.parse(readFileSync(join(root, "package.json"))).version,
  );
});
