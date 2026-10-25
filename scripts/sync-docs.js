
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

function updateTransactionDocumentation() {
  const docPath = path.join(DOCS_DIR, "business-logic.md");
  const startMarker = "<!-- AUTO-GENERATED: TRANSACTION RULES START -->";
  const endMarker = "<!-- AUTO-GENERATED: TRANSACTION RULES END -->";

  const generated = [
    startMarker,
    "## Transaction service behavior",
    "",
    "Source: `src/services/transactionService.js`",
    "",
    "### Deposits",
    "- The deposit amount must pass `requirePositiveNumber`.",
    "- The transaction is recorded as `DEPOSIT` with an ISO timestamp and resulting balance.",
    "- The account balance is increased by the deposit amount.",
    "",
    "### Withdrawals",
    "- The withdrawal amount must pass `requirePositiveNumber`.",
    "- If the amount exceeds the balance, the withdrawal is not completed.",
    "- An overdraft attempt deducts a penalty of 5 balance units and records `OVERDRAFT_ATTEMPT`.",
    "- Otherwise, the amount is deducted and a `WITHDRAWAL` transaction is recorded.",
    "",
    "### Transfers",
    "- Both source and destination accounts must have account numbers.",
    "- The amount must pass `requirePositiveNumber` and cannot exceed the source balance.",
    "- A successful transfer records `TRANSFER_OUT` and `TRANSFER_IN` entries.",
    "- Both accounts' balances and transaction histories are updated.",
    "",
    "### Transaction retrieval",
    "- The account argument must be an object.",
    "- Transactions can be filtered by start date, end date, and transaction type.",
    "- Date-only start boundaries use the start of the UTC day; date-only end boundaries use the end of the UTC day.",
    "- Invalid dates and a start date later than the end date cause errors.",
    "- Results are sorted newest first; transactions with invalid dates are excluded.",
    "",
    endMarker,
  ].join("\n");

  let content = fs.readFileSync(docPath, "utf8");
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start !== -1 && end !== -1 && end >= start) {
    content =
      content.slice(0, start) +
      generated +
      content.slice(end + endMarker.length);
  } else {
    content += `\n\n${generated}\n`;
  }

  fs.writeFileSync(docPath, content);
  console.log("Updated transaction behavior in docs/business-logic.md");
}

function updateInterestDocumentation() {
  const docPath = path.join(DOCS_DIR, "business-logic.md");
  const startMarker = "<!-- AUTO-GENERATED: INTEREST RULES START -->";
  const endMarker = "<!-- AUTO-GENERATED: INTEREST RULES END -->";

  const generated = [
    startMarker,
    "## Savings interest service behavior",
    "",
    "Source: `src/services/interestService.js`",
    "",
    "### Eligibility",
    "- The service initializes the account's transactions array if needed.",
    "- If the balance is 500 or less, no interest transaction is recorded.",
    "- Interest is calculated only when the balance is greater than 500.",
    "",
    "### Interest calculation",
    "- The rate per invocation is 0.00167 (0.167%).",
    "- Interest amount = current balance × 0.00167.",
    "- The service records an `INTEREST` transaction with an ISO timestamp and calculated new balance.",
    "",
    "### Balance handling",
    "- The returned summary contains the current balance plus the calculated interest.",
    "- The function does not assign the calculated balance back to `account.balance`.",
    "- Calling this function repeatedly recalculates interest from the account's existing balance unless another operation updates that balance.",
    "",
    endMarker,
  ].join("\n");

  let content = fs.readFileSync(docPath, "utf8");
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start !== -1 && end !== -1 && end >= start) {
    content =
      content.slice(0, start) +
      generated +
      content.slice(end + endMarker.length);
  } else {
    content += `\n\n${generated}\n`;
  }

  fs.writeFileSync(docPath, content);
  console.log("Updated interest behavior in docs/business-logic.md");
}

function updateSecurityDocumentation() {
  const docPath = path.join(DOCS_DIR, "business-logic.md");
  const startMarker = "<!-- AUTO-GENERATED: SECURITY RULES START -->";
  const endMarker = "<!-- AUTO-GENERATED: SECURITY RULES END -->";

  const generated = [
    startMarker,
    "## Security service behavior",
    "",
    "Source: `src/services/securityService.js`",
    "",
    "### Account freezing",
    "- Accounts without a status are initialized as ACTIVE.",
    "- FREEZE requires a non-empty manager ID.",
    "- UNFREEZE sets the account status to ACTIVE.",
    "- Status changes are recorded in statusHistory with an action, actor, and ISO timestamp.",
    "- Transactions through the freeze-aware wrappers are rejected when the relevant account is frozen.",
    "",
    "### Daily withdrawal limit",
    "- The wrapper rejects withdrawals from frozen accounts.",
    "- The daily limit is 500 balance units, based on UTC transaction dates.",
    "- Only transactions of type WITHDRAWAL with numeric amounts count toward the limit.",
    "- The requested withdrawal is rejected if the total would exceed 500.",
    "",
    "### Password validation",
    "- Passwords must be strings with at least 12 characters.",
    "- Passwords must contain uppercase and lowercase letters, a number, and a special character.",
    "- Common passwords in the implementation's blocklist and passwords containing the word 'password' are rejected.",
    "",
    "### Suspicious activity",
    "- Numeric transaction amounts greater than 10,000 generate high-value alerts.",
    "- Three or more withdrawals of 500 units or less within five minutes trigger a rapid-withdrawal alert.",
    "- The result includes an isSuspicious boolean and an alerts array.",
    "",
    "### Freeze-aware wrappers",
    "- addDepositSafe rejects deposits when the account is frozen.",
    "- transferMoneySafe rejects transfers if either account is frozen.",
    "- These wrappers delegate successful operations to the transaction service.",
    "",
    endMarker,
  ].join("\n");

  let content = fs.readFileSync(docPath, "utf8");
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start !== -1 && end !== -1 && end >= start) {
    content =
      content.slice(0, start) +
      generated +
      content.slice(end + endMarker.length);
  } else {
    content += `\n\n${generated}\n`;
  }

  fs.writeFileSync(docPath, content);
  console.log("Updated security behavior in docs/business-logic.md");
}


function updateAccountStoreDocumentation() {
  const docPath = path.join(DOCS_DIR, "data-model.md");
  const startMarker = "<!-- AUTO-GENERATED: ACCOUNT STORE START -->";
  const endMarker = "<!-- AUTO-GENERATED: ACCOUNT STORE END -->";

  const generated = [
    startMarker,
    "## Account store behavior",
    "",
    "Source: `src/models/accountStore.js`",
    "",
    "### Storage",
    "- Accounts are held in an in-memory array named `accounts`.",
    "- `getAccounts()` returns the accounts array directly.",
    "- This module does not implement persistent database storage.",
    "",
    "### Account number generation",
    "- Account numbers are generated as 10-digit strings.",
    "- Generation retries while the number matches an existing account.",
    "",
    "### Account creation",
    "- Account data must be an object.",
    "- First and last names must pass `requireNonEmptyString`.",
    "- The initial deposit must be a number and cannot be NaN.",
    "- Initial deposits below 50 are rejected.",
    "- A successful account receives an account number, names, initial balance, and ISO creation timestamp.",
    "- The new account is appended to the in-memory array and returned.",
    "",
    endMarker,
  ].join("\n");

  let content = fs.readFileSync(docPath, "utf8");
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if (start !== -1 && end !== -1 && end >= start) {
    content =
      content.slice(0, start) +
      generated +
      content.slice(end + endMarker.length);
  } else {
    content += `\n\n${generated}\n`;
  }

  fs.writeFileSync(docPath, content);
  console.log("Updated account store documentation in docs/data-model.md");
}



try {
  const files = readSourceFiles();
  updateConfiguration(files);
  updateBusinessLogic(files);
  updateTransactionDocumentation();
  updateInterestDocumentation();
  updateSecurityDocumentation();
  updateAccountStoreDocumentation();
  reportAffectedDocs();

  console.log(`Mapped ${files.length} source files to documentation targets.`);
} catch (error) {
  console.error("Documentation sync failed:", error.message);
  process.exitCode = 1;
}

