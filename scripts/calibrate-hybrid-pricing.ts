#!/usr/bin/env tsx
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  buildCalibrationReport,
  formatCalibrationReport,
  toPricingDocument
} from "../packages/payments/src/pricing-calibration/index.js";

function parseArgs(argv: readonly string[]) {
  const writePricing = argv.includes("--write-pricing");
  const inputPath = argv.find((arg) => !arg.startsWith("--")) ?? "tests/fixtures/billing/calibration-jobs-production.json";
  const reportPath =
    argv[argv.indexOf("--report") + 1] ??
    "docs/superpowers/reports/2026-06-18-hybrid-pricing-calibration.md";
  const pricingPath =
    argv[argv.indexOf("--pricing") + 1] ??
    "apps/backend/policies/official/2026-06-18/pricing.json";

  return { inputPath, reportPath, pricingPath, writePricing };
}

function main(): void {
  const { inputPath, reportPath, pricingPath, writePricing } = parseArgs(process.argv.slice(2));
  const absoluteInput = resolve(inputPath);

  let jobs: unknown;
  try {
    jobs = JSON.parse(readFileSync(absoluteInput, "utf8"));
  } catch {
    console.error(`Could not read calibration input at ${absoluteInput}`);
    console.error("Export production jobs first:");
    console.error("  DATABASE_URL=... tsx scripts/export-calibration-jobs.ts");
    process.exit(1);
  }

  const report = buildCalibrationReport({ jobs });
  const markdown = formatCalibrationReport(report);

  mkdirSync(dirname(resolve(reportPath)), { recursive: true });
  writeFileSync(resolve(reportPath), `${markdown}\n`);
  console.log(formatCalibrationReport(report));
  console.log(`\nReport written to ${reportPath}`);

  if (writePricing) {
    const document = toPricingDocument(report);
    mkdirSync(dirname(resolve(pricingPath)), { recursive: true });
    writeFileSync(resolve(pricingPath), `${JSON.stringify(document, null, 2)}\n`);
    console.log(`Pricing document written to ${pricingPath}`);
  }
}

main();
