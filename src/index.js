/**
 * Banking System — main entry point.
 *
 * Demonstrates account creation, deposits, withdrawals, transfers,
 * interest calculation, and security features.
 */

const { generateBankAccount, getAccounts } = require("./models/accountStore");
const {
  addDeposit,
  withdrawal,
  transferMoney,
  retrieveTransactionsInRange,
} = require("./services/transactionService");
const { calculateSaving } = require("./services/interestService");
const {
  updateAccountStatus,
  withdrawalWithDailyLimit,
  validatePassword,
  checkForSuspiciousActivity,
  addDepositSafe,
  transferMoneySafe,
} = require("./services/securityService");

// ── Create accounts ────────────────────────────────────────────────────────────

const account1 = generateBankAccount({
  firstName: "John",
  lastName: "Doe",
  initialDeposit: 100,
});

const account2 = generateBankAccount({
  firstName: "Jane",
  lastName: "Smith",
  initialDeposit: 200,
});

const account3 = generateBankAccount({
  firstName: "Alice",
  lastName: "Johnson",
  initialDeposit: 300,
});

console.log("=== Accounts Created ===");
console.log(getAccounts());

// ── Deposit ────────────────────────────────────────────────────────────────────

console.log("\n=== Deposit $50 into Account 1 ===");
console.log(addDeposit(account1, 50));

// ── Withdrawal ─────────────────────────────────────────────────────────────────

console.log("\n=== Withdraw $30 from Account 2 ===");
console.log(withdrawal(account2, 30));

// ── Transfer ───────────────────────────────────────────────────────────────────

console.log("\n=== Transfer $25 from Account 3 → Account 1 ===");
console.log(transferMoney(account3, account1, 25));

// ── Interest ───────────────────────────────────────────────────────────────────

console.log("\n=== Calculate Savings Interest (Account 3) ===");
console.log(calculateSaving(account3));

// ── Retrieve Transactions ──────────────────────────────────────────────────────

console.log("\n=== Account 1 Transactions ===");
console.log(retrieveTransactionsInRange(account1));

// ── Password Validation ────────────────────────────────────────────────────────

console.log("\n=== Password Validation ===");
console.log(validatePassword("short"));
console.log(validatePassword("Str0ng!Pass#2026"));

// ── Suspicious Activity ────────────────────────────────────────────────────────

console.log("\n=== Suspicious Activity Check (Account 1) ===");
console.log(checkForSuspiciousActivity(account1));

// ── Freeze / Unfreeze ──────────────────────────────────────────────────────────

console.log("\n=== Freeze Account 2 ===");
console.log(updateAccountStatus(account2, "FREEZE", "MGR-001"));

console.log("\n=== Attempt Deposit on Frozen Account ===");
try {
  addDepositSafe(account2, 100);
} catch (err) {
  console.log("Blocked:", err.message);
}

console.log("\n=== Unfreeze Account 2 ===");
console.log(updateAccountStatus(account2, "UNFREEZE"));
