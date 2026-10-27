import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
test("a consumer checkout path containing spaces can run the CLI tests", () => {
  const temp = fs.mkdtempSync(
    path.join(os.tmpdir(), "Decision geometry spaces-"),
  );
  try {
    fs.cpSync(
      fileURLToPath(new URL("./", import.meta.url)),
      path.join(temp, "capsule"),
      { recursive: true },
    );
    const r = spawnSync(
      process.execPath,
      ["--test", path.join(temp, "capsule/cli-test.mjs")],
      { encoding: "utf8" },
    );
    assert.equal(r.status, 0, r.stdout + "\n" + r.stderr);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
