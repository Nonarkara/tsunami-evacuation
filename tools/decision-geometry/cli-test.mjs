import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { spec, good } from "./fixtures.mjs";
test("the executable gate exits nonzero for a spatial regression and malformed input", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "decision-geometry-"));
  const contract = path.join(root, "contract.json"),
    captures = path.join(root, "captures.json");
  fs.writeFileSync(contract, JSON.stringify({ version: 1, cases: [spec] }));
  fs.writeFileSync(captures, JSON.stringify([good]));
  const run = () =>
    spawnSync(
      process.execPath,
      [
        fileURLToPath(new URL("./check.mjs", import.meta.url)),
        contract,
        captures,
      ],
      { encoding: "utf8" },
    );
  try {
    assert.equal(run().status, 0);
    const bad = structuredClone(good);
    bad.regions.map.rect.height = 650;
    fs.writeFileSync(captures, JSON.stringify([bad]));
    assert.equal(run().status, 2);
    fs.writeFileSync(captures, "{");
    assert.equal(run().status, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
