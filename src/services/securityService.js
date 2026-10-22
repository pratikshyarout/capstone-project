/**
 * Security service — account freezing, password validation,
 * daily withdrawal limits, and suspicious-activity detection.
 */

const {
  requireNonEmptyString,
  requirePositiveNumber,
} = require("../utils/validators");
const {
  ensureTransactions,
  addDeposit,
  withdrawal,
  transferMoney,
} = require("./transactionService");

// ── Freeze / Unfreeze ──────────────────────────────────────────────────────────

/**
 * Freezes or unfreezes an account. Freezing requires manager approval.
 * @param {Object} account   - The target account.
 * @param {string} action    - "FREEZE" or "UNFREEZE".
 * @param {string} [managerId] - Required when freezing.
 * @returns {Object} Account status summary.
 */
function updateAccountStatus(account, action, managerId) {
  if (!account || typeof account !== "object") {
    throw new Error("Account is required.");
  }

  if (!account.status) account.status = "ACTIVE";
  if (!Array.isArray(account.statusHistory)) account.statusHistory = [];

  const normalizedAction = requireNonEmptyString(
    action,
    "Action",
  ).toUpperCase();

  const hasManagerApproval =
    typeof managerId === "string" && managerId.trim().length > 0;

  if (normalizedAction === "FREEZE" && !hasManagerApproval) {
    throw new Error("Manager approval is required to freeze an account.");
  }

  if (normalizedAction !== "FREEZE" && normalizedAction !== "UNFREEZE") {
    throw new Error('Action must be "FREEZE" or "UNFREEZE".');
  }

  const nextStatus = normalizedAction === "FREEZE" ? "FROZEN" : "ACTIVE";

  if (account.status !== nextStatus) {
    account.status = nextStatus;
    account.statusHistory.push({
      action: normalizedAction,
      by: hasManagerApproval ? managerId.trim() : "system",
      date: new Date().toISOString(),
    });
  }

  return {
    accountNumber: account.accountNumber,
    status: account.status,
    statusHistory: account.statusHistory,
  };
}

/**
 * Throws if the account is frozen.
 * @param {Object} account - The account to check.
 */
function assertAccountNotFrozen(account) {
  if (!account.status) account.status = "ACTIVE";
  if (account.status === "FROZEN") {
    throw new Error("Account is frozen. Transactions are not allowed.");
  }
}

// ── Daily Withdrawal Limit ─────────────────────────────────────────────────────

/**
 * Withdrawal wrapper that enforces a $500 daily withdrawal limit.
 * @param {Object} account - The source account.
 * @param {number} amount  - Amount to withdraw.
 * @returns {Object} Account summary with transactions.
 */
function withdrawalWithDailyLimit(account, amount) {
  assertAccountNotFrozen(account);
  requirePositiveNumber(amount, "Withdrawal amount");
  ensureTransactions(account);

  const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)

  const withdrawnToday = account.transactions
    .filter(
      (t) =>
        t.type === "WITHDRAWAL" &&
        typeof t.amount === "number" &&
        String(t.date).slice(0, 10) === todayKey,
    )
    .reduce((sum, t) => sum + t.amount, 0);

  if (withdrawnToday + amount > 500) {
    throw new Error("Daily withdrawal limit exceeded ($500 max)");
  }

  return withdrawal(account, amount);
}

// ── Password Validation ────────────────────────────────────────────────────────

/**
 * Validates a password against strength requirements.
 * @param {string} password - The password to validate.
 * @returns {{ valid: boolean, reasons?: string[] }} Validation result.
 */
function validatePassword(password) {
  const reasons = [];

  if (typeof password !== "string") {
    return { valid: false, reasons: ["Password must be a string"] };
  }

  if (password.length < 12)
    reasons.push("Password must be at least 12 characters");
  if (!/[A-Z]/.test(password))
    reasons.push("Password must contain an uppercase letter");
  if (!/[a-z]/.test(password))
    reasons.push("Password must contain a lowercase letter");
  if (!/[0-9]/.test(password)) reasons.push("Password must contain a number");
  if (!/[^A-Za-z0-9]/.test(password))
    reasons.push("Password must contain a special character");

  const commonPasswords = new Set([
    "password",
    "password123",
    "123456789012",
    "qwertyuiop12",
    "letmein123456",
    "adminadmin123",
    "iloveyou12345",
    "welcome123456",
  ]);

  const lowered = password.toLowerCase();
  if (commonPasswords.has(lowered) || lowered.includes("password")) {
    reasons.push("Password is too common");
  }

  return reasons.length ? { valid: false, reasons } : { valid: true };
}

// ── Suspicious Activity ────────────────────────────────────────────────────────

/**
 * Scans an account's transactions for suspicious patterns.
 * Flags: transactions > $10 000, rapid small withdrawals (3+ in 5 min).
 * @param {Object} account - The account to audit.
 * @returns {{ isSuspicious: boolean, alerts: string[] }}
 */
function checkForSuspiciousActivity(account) {
  ensureTransactions(account);

  const alerts = [];

  // Alert on transactions > $10,000
  for (const t of account.transactions) {
    if (typeof t.amount === "number" && t.amount > 10000) {
      const kind =
        t.type === "TRANSFER_OUT" || t.type === "TRANSFER_IN"
          ? "transfer"
          : t.type === "WITHDRAWAL"
            ? "withdrawal"
            : t.type === "DEPOSIT"
              ? "deposit"
              : "transaction";

      alerts.push(`High-value transaction: $${t.amount} ${kind}`);
    }
  }

  // Alert on rapid sequence of small withdrawals (3+ within 5 minutes)
  const smallWithdrawals = account.transactions
    .filter(
      (t) =>
        t.type === "WITHDRAWAL" &&
        typeof t.amount === "number" &&
        t.amount <= 500,
    )
    .map((t) => ({ ...t, _ms: new Date(t.date).getTime() }))
    .sort((a, b) => a._ms - b._ms);

  const windowMs = 5 * 60 * 1000;
  let flaggedRapid = false;

  for (let i = 0; i < smallWithdrawals.length && !flaggedRapid; i++) {
    for (let j = i + 2; j < smallWithdrawals.length; j++) {
      const span = smallWithdrawals[j]._ms - smallWithdrawals[i]._ms;
      if (span <= windowMs) {
        const count = j - i + 1;
        const minutes = Math.max(1, Math.round(span / 60000));
        alerts.push(
          `Rapid withdrawals: ${count} transactions within ${minutes} minutes`,
        );
        flaggedRapid = true;
        break;
      }
      if (span > windowMs) break;
    }
  }

  return { isSuspicious: alerts.length > 0, alerts };
}

// ── Safe Wrappers (freeze-aware) ───────────────────────────────────────────────

/**
 * Deposits money only if the account is not frozen.
 */
function addDepositSafe(account, amount) {
  assertAccountNotFrozen(account);
  return addDeposit(account, amount);
}

/**
 * Transfers money only if neither account is frozen.
 */
function transferMoneySafe(fromAccount, toAccount, amount) {
  assertAccountNotFrozen(fromAccount);
  assertAccountNotFrozen(toAccount);
  return transferMoney(fromAccount, toAccount, amount);
}

module.exports = {
  updateAccountStatus,
  assertAccountNotFrozen,
  withdrawalWithDailyLimit,
  validatePassword,
  checkForSuspiciousActivity,
  addDepositSafe,
  transferMoneySafe,
};
