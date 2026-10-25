
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const requiredDocs = [
  "docs/business-logic.md",
  "docs/configuration.md",
  "docs/data-model.md",
  "docs/setup-guide.md",
];

let hasErrors = false;

for (const relativePath of requiredDocs) {
  const fullPath = path.join(ROOT, relativePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`Missing documentation: ${relativePath}`);
    hasErrors = true;
    continue;
  }

  const content = fs.readFileSync(fullPath, "utf8").trim();

  if (!content) {
    console.error(`Empty documentation: ${relativePath}`);
    hasErrors = true;
  } else {
    console.log(`OK: ${relativePath}`);
  }
}

const configuration = path.join(ROOT, "docs/configuration.md");

if (fs.existsSync(configuration)) {
  const content = fs.readFileSync(configuration, "utf8");

  if (!content.includes("<!-- AUTO-GENERATED: SOURCE INVENTORY START -->")) {
    console.error("Source inventory has not been generated.");
    hasErrors = true;
  }
}

if (hasErrors) {
  process.exitCode = 1;
} else {
  console.log("Documentation validation passed.");
}
