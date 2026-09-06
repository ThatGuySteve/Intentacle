import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("packed install exposes a working CLI, library, declarations, and schema", () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const folder = mkdtempSync(join(tmpdir(), "intentacle-install-"));
  const npm = process.env.npm_execpath;
  assert.ok(
    npm,
    "Run this packaging smoke check through npm test or npm run check.",
  );
  function run(args, cwd = folder) {
    const result = spawnSync(process.execPath, args, {
      cwd,
      encoding: "utf8",
      timeout: 60000,
    });
    assert.equal(
      result.status,
      0,
      `${result.error ?? ""}\n${result.stderr}\n${result.stdout}`,
    );
    return result.stdout;
  }
  try {
    const packed = JSON.parse(
      run(
        [
          npm,
          "pack",
          "--ignore-scripts",
          "--json",
          "--pack-destination",
          folder,
        ],
        root,
      ),
    )[0];
    const paths = new Set(packed.files.map((file) => file.path));
    for (const file of [
      "dist/index.js",
      "dist/index.d.ts",
      "dist/cli.js",
      "schema/task.schema.json",
    ])
      assert.ok(paths.has(file), `${file} must be packaged`);
    writeFileSync(
      join(folder, "package.json"),
      JSON.stringify({ private: true, type: "module" }),
    );
    run([
      npm,
      "install",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      join(folder, packed.filename),
    ]);
    const cli = join(folder, "node_modules/intentacle/dist/cli.js");
    assert.match(run([cli, "--version"]), /0\.1\.0-dev\.0/);
    const literal = JSON.parse(
      run([cli, "init", "Review the function.", "--id", "installed"]),
    );
    assert.equal(literal.task_id, "installed");
    writeFileSync(
      join(folder, "smoke.mjs"),
      `
import assert from 'node:assert/strict';
import { createTask, renderTask, validateTask } from 'intentacle';
import schema from 'intentacle/schema' with { type: 'json' };
const record = createTask('Review the function.', 'installed-api');
assert.equal(validateTask(record).valid, true);
assert.equal(renderTask(record).manifest.task_id, 'installed-api');
assert.equal(schema.properties.schema_version.const, record.schema_version);
`,
    );
    run([join(folder, "smoke.mjs")]);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
