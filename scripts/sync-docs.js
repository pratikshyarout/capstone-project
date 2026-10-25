
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const DOCS_DIR = path.join(ROOT, "docs");

const SOURCE_FILES = [
  "services/transactionService.js",
  "services/interestService.js",
  "services/securityService.js",
  "models/accountStore.js",
  "utils/validators.js",
];

function readSourceFiles() {
  return SOURCE_FILES.map((relativePath) => {
    const fullPath = path.join(SRC_DIR, relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Source file not found: src/${relativePath}`);
    }

    return {
      path: `src/${relativePath}`,
      content: fs.readFileSync(fullPath, "utf8"),
    };
  });
}

function generateSourceInventory(files) {
  const date = new Date().toISOString().slice(0, 10);

  const lines = [
    "<!-- AUTO-GENERATED: SOURCE INVENTORY START -->",
    `Last generated: ${date}`,
    "",
    "The following source files are used by the documentation sync script:",
    "",
    ...files.map((file) => `- \`${file.path}\``),
    "",
    "<!-- AUTO-GENERATED: SOURCE INVENTORY END -->",
  ];

  return lines.join("\n");
}

function updateDocumentation(files) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });

  const docPath = path.join(DOCS_DIR, "configuration.md");
  const startMarker = "<!-- AUTO-GENERATED: SOURCE INVENTORY START -->";
  const endMarker = "<!-- AUTO-GENERATED: SOURCE INVENTORY END -->";

  const generatedSection = generateSourceInventory(files);

  let existing = fs.existsSync(docPath)
    ? fs.readFileSync(docPath, "utf8")
    : "# Configuration\n\n";

  const start = existing.indexOf(startMarker);
  const end = existing.indexOf(endMarker);

  if (start !== -1 && end !== -1 && end >= start) {
    existing =
      existing.slice(0, start) +
      generatedSection +
      existing.slice(end + endMarker.length);
  } else {
    existing += `\n\n${generatedSection}\n`;
  }

  fs.writeFileSync(docPath, existing);
  console.log("Updated docs/configuration.md");
}

function main() {
  const files = readSourceFiles();

  // Confirm that source files are readable before changing documentation.
  const totalBytes = files.reduce(
    (total, file) => total + Buffer.byteLength(file.content, "utf8"),
    0
  );

  updateDocumentation(files);

  console.log(`Checked ${files.length} source files (${totalBytes} bytes).`);
}

try {
  main();
} catch (error) {
  console.error("Documentation sync failed:", error.message);
  process.exitCode = 1;
}
