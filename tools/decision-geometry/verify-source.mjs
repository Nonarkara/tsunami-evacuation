import fs from "node:fs";
import crypto from "node:crypto";
const manifest = JSON.parse(
  fs.readFileSync(new URL("./SOURCE.json", import.meta.url), "utf8"),
);
let failures = 0;
for (const [file, want] of Object.entries(manifest.files)) {
  if (!/^[\w.-]+$/.test(file))
    throw new Error("Invalid distribution filename.");
  const got = crypto
    .createHash("sha256")
    .update(fs.readFileSync(new URL(file, import.meta.url)))
    .digest("hex");
  if (got !== want) {
    console.error(`Distribution differs: ${file}`);
    failures++;
  }
}
if (failures) process.exitCode = 1;
else console.log("Canonical capsule hashes match.");
