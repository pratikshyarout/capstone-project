
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const DOCS_DIR = path.join(ROOT, "docs");

const SOURCE_MAP = {
  "services/transactionService.js": ["business-logic.md"],
  "services/interestService.js": ["business-logic.md"],
  "services/securityService.js": ["business-logic.md"],
  "models/accountStore.js": ["data-model.md"],
  "utils/validators.js": ["business-logic.md"],
};

function readSourceFiles() {
  return Object.keys(SOURCE_MAP).map((relativePath) => {
    const fullPath = path.join(SRC_DIR, relativePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Source file not found: src/${relativePath}`);
    }

    return {
      path: `src/${relativePath}`,
      docs: SOURCE_MAP[relativePath],
    };
  });
}

function generateInventory(files) {
  const lines = [
    "<!-- AUTO-GENERATED: SOURCE INVENTORY START -->",
    `Last generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "## Source-to-documentation mapping",
    "",
  ];

  for (const file of files) {
    const targets = file.docs.map((doc) => `\`docs/${doc}\``);
    lines.push(`- \`${file.path}\` → ${targets.join(", ")}`);
  }

  lines.push("", "<!-- AUTO-GENERATED: SOURCE INVENTORY END -->");
  return lines.join("\n");
}

function updateConfiguration(files) {
  fs.mkdirSync(DOCS_DIR, { recursive: true });

  const docPath = path.join(DOCS_DIR, "configuration.md");
  const startMarker = "<!-- AUTO-GENERATED: SOURCE INVENTORY START -->";
  const endMarker = "<!-- AUTO-GENERATED: SOURCE INVENTORY END -->";

  let content = fs.existsSync(docPath)
    ? fs.readFileSync(docPath, "utf8")
    : "# Configuration\n\n";

  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start !== -1 && end !== -1 && end >= start) {
    content =
      content.slice(0, start) +
      generateInventory(files) +
      content.slice(end + endMarker.length);
  } else {
    content += `\n\n${generateInventory(files)}\n`;
  }

  fs.writeFileSync(docPath, content);
  console.log("Updated docs/configuration.md");
}

function reportAffectedDocs() {
  const changedFiles = (process.env.CHANGED_FILES || "")
    .split(/\r?\n/)
    .map((file) => file.trim().replace(/\\/g, "/"))
    .filter(Boolean);

  const affectedDocs = new Set();

  for (const file of changedFiles) {
    const relativePath = file.replace(/^src\//, "");
    const targets = SOURCE_MAP[relativePath];

    if (targets) {
      targets.forEach((doc) => affectedDocs.add(`docs/${doc}`));
    }
  }

  if (changedFiles.length === 0) {
    console.log("No changed-file list supplied; generated the source mapping only.");
  } else {
    console.log("Changed files:", changedFiles.join(", "));
  }

  if (affectedDocs.size > 0) {
    console.log(
      "Documentation requiring review:",
      [...affectedDocs].join(", ")
    );
  } else {
    console.log("No mapped documentation targets found for changed files.");
  }
}

function updateBusinessLogic(files) {
  const docPath = path.join(DOCS_DIR, "business-logic.md");
  const startMarker = "<!-- AUTO-GENERATED: SOURCE FUNCTIONS START -->";
  const endMarker = "<!-- AUTO-GENERATED: SOURCE FUNCTIONS END -->";

  let content = fs.readFileSync(docPath, "utf8");
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      "Add the source-functions markers to docs/business-logic.md first."
    );
  }

  const lines = [
    startMarker,
    "## Source function inventory",
    "",
  ];

  for (const file of files) {
    const relativePath = file.path.replace(/^src\//, "");
    const fullPath = path.join(SRC_DIR, relativePath);
    const source = fs.readFileSync(fullPath, "utf8");

    const functions = new Set();
    const patterns = [
      /function\s+([A-Za-z_$][\w$]*)\s*\(/g,
      /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/g,
      /(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/g,
    ];

    for (const pattern of patterns) {
      for (const match of source.matchAll(pattern)) {
        functions.add(match[1]);
      }
    }

    lines.push(`### \`${file.path}\``, "");

    if (functions.size) {
      for (const name of [...functions].sort()) {
        lines.push(`- \`${name}()\``);
      }
    } else {
      lines.push("- No functions detected by the current scanner.");
    }

    lines.push("");
  }

  lines.push(endMarker);

  content =
    content.slice(0, start) +
    lines.join("\n") +
    content.slice(end + endMarker.length);

  fs.writeFileSync(docPath, content);
  console.log("Updated source function inventory in docs/business-logic.md");
}


try {
  const files = readSourceFiles();
  updateConfiguration(files);
  updateBusinessLogic(files);
  reportAffectedDocs();

  console.log(`Mapped ${files.length} source files to documentation targets.`);
} catch (error) {
  console.error("Documentation sync failed:", error.message);
  process.exitCode = 1;
}

