import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
    assert.ok(
      packed.size < 128 * 1024,
      "The runtime tarball should remain below 128 KiB.",
    );
    assert.ok(
      ![...paths].some((path) => path.startsWith("assets/")),
      "Artwork belongs in the repository, outside the runtime package.",
    );
    for (const file of [
      "dist/index.js",
      "dist/index.d.ts",
      "dist/cli.js",
      "schema/task.schema.json",
      "LICENSE",
    ])
      assert.ok(paths.has(file), `${file} must be packaged`);
    // npm ci caches tarballs but need not cache registry metadata. Build a
    // consumer lock from our pinned runtime graph so the smoke install requires
    // no metadata lookup and works immediately after a clean npm ci.
    const sourcePackage = JSON.parse(readFileSync(join(root, "package.json")));
    const sourceLock = JSON.parse(
      readFileSync(join(root, "package-lock.json")),
    );
    const consumer = {
      name: "intentacle-install-smoke",
      version: "1.0.0",
      private: true,
      type: "module",
      dependencies: { intentacle: `file:${packed.filename}` },
    };
    const runtimePackages = Object.fromEntries(
      Object.entries(sourceLock.packages).filter(
        ([path, entry]) => path && !entry.dev,
      ),
    );
    const consumerLock = {
      name: consumer.name,
      version: consumer.version,
      lockfileVersion: 3,
      requires: true,
      packages: {
        "": consumer,
        ...runtimePackages,
        "node_modules/intentacle": {
          version: sourcePackage.version,
          resolved: `file:${packed.filename}`,
          integrity: packed.integrity,
          dependencies: sourcePackage.dependencies,
          bin: sourcePackage.bin,
          engines: sourcePackage.engines,
        },
      },
    };
    writeFileSync(join(folder, "package.json"), JSON.stringify(consumer));
    writeFileSync(
      join(folder, "package-lock.json"),
      JSON.stringify(consumerLock),
    );
    run([
      npm,
      "ci",
      "--offline",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
    ]);
    const installedPackage = JSON.parse(
      readFileSync(join(folder, "node_modules/intentacle/package.json")),
    );
    assert.equal(installedPackage.license, "Apache-2.0");
    assert.equal(
      readFileSync(join(folder, "node_modules/intentacle/LICENSE"), "utf8"),
      readFileSync(join(root, "LICENSE"), "utf8"),
    );
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
