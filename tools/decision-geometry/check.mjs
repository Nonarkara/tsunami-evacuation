#!/usr/bin/env node
import fs from "node:fs";
import { evaluateSuite } from "./index.mjs";
const [contract, report, ...rest] = process.argv.slice(2);
if (!contract || !report || rest.length) {
  console.error("Usage: node check.mjs <contract.json> <captures.json>");
  process.exit(1);
}
try {
  const result = evaluateSuite(
    JSON.parse(fs.readFileSync(contract, "utf8")),
    JSON.parse(fs.readFileSync(report, "utf8")),
  );
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === "FAIL" ? 2 : 0;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
