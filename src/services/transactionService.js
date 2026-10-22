/**
 * Transaction service — deposit, withdrawal, transfer, and retrieval.
 */

const {
  requirePositiveNumber,
  requireNonEmptyString,
} = require("../utils/validators");

/**
 * Ensures the account has a transactions array.
 * @param {Object} account - The bank account.
 * @returns {Array} The transactions array.
 */
function ensureTransactions(account) {
  if (!Array.isArray(account.transactions)) {
    account.transactions = [];
  }
  return account.transactions;
}

// ── Deposit ────────────────────────────────────────────────────────────────────

/**
 * Deposits money into an account and records the transaction.
 * @param {Object} account - The target account.
 * @param {number} amount  - Amount to deposit.
 * @returns {Object} The updated account.
 */
function addDeposit(account, amount) {
  requirePositiveNumber(amount, "Deposit amount");

  const transactions = ensureTransactions(account);
  const transaction = {
    type: "DEPOSIT",
    amount,
    date: new Date().toISOString(),
    newBalance: account.balance + amount,
  };

  transactions.push(transaction);
  account.balance += amount;
  return account;
}

// ── Withdrawal ─────────────────────────────────────────────────────────────────

/**
 * Processes a withdrawal with overdraft protection.
 * If the amount exceeds the balance a $5 penalty is applied instead.
 * @param {Object} account - The source account.
 * @param {number} amount  - Amount to withdraw.
 * @returns {Object} Account summary with transactions.
 */
function withdrawal(account, amount) {
  requirePositiveNumber(amount, "Withdrawal amount");

  const transactions = ensureTransactions(account);

  if (amount > account.balance) {
    const penalty = 5;
    account.balance -= penalty;

    transactions.push({
      type: "OVERDRAFT_ATTEMPT",
      amount,
      date: new Date().toISOString(),
      penalty,
      newBalance: account.balance,
    });

    return {
      accountNumber: account.accountNumber,
      balance: account.balance,
      transactions,
    };
  }

  account.balance -= amount;
  transactions.push({
    type: "WITHDRAWAL",
    amount,
    date: new Date().toISOString(),
    newBalance: account.balance,
  });

  return {
    accountNumber: account.accountNumber,
    balance: account.balance,
    transactions,
  };
}

// Backwards-compatible alias
const withDrawal = withdrawal;

// ── Transfer ───────────────────────────────────────────────────────────────────

/**
 * Transfers money between two accounts.
 * @param {Object} from   - Source account.
 * @param {Object} to     - Destination account.
 * @param {number} amount - Amount to transfer.
 * @returns {Array} Updated summaries for both accounts.
 */
function transferMoney(from, to, amount) {
  if (!from?.accountNumber || !to?.accountNumber) {
    throw new Error("Account must be available!");
  }
  requirePositiveNumber(amount, "Amount");
  if (amount > from.balance) {
    throw new Error("Insufficient funds for transfer.");
  }

  ensureTransactions(from);
  ensureTransactions(to);

  from.balance -= amount;
  from.transactions.push({
    type: "TRANSFER_OUT",
    to: to.accountNumber,
    amount,
    date: new Date().toISOString(),
    newBalance: from.balance,
  });

  to.balance += amount;
  to.transactions.push({
    type: "TRANSFER_IN",
    from: from.accountNumber,
    amount,
    date: new Date().toISOString(),
    newBalance: to.balance,
  });

  return [
    {
      accountNumber: from.accountNumber,
      balance: from.balance,
      transactions: from.transactions,
    },
    {
      accountNumber: to.accountNumber,
      balance: to.balance,
      transactions: to.transactions,
    },
  ];
}

// ── Retrieve Transactions ──────────────────────────────────────────────────────

/**
 * Retrieves transactions within a date range, optionally filtered by type.
 * Results are sorted by date descending (newest first).
 * @param {Object} account           - The account to query.
 * @param {Object} [options]         - Filter options.
 * @param {string} [options.startDate] - Range start (ISO or YYYY-MM-DD).
 * @param {string} [options.endDate]   - Range end   (ISO or YYYY-MM-DD).
 * @param {string} [options.type]      - Transaction type filter.
 * @returns {Array} Matching transactions sorted newest-first.
 */
function retrieveTransactionsInRange(account, options = {}) {
  if (!account || typeof account !== "object") {
    throw new Error("Account is required.");
  }

  const { startDate, endDate, type } = options;
  const transactions = ensureTransactions(account);

  const isDateOnly = (value) =>
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

  const parseBoundaryMs = (value, isEndOfDay) => {
    if (!value) return null;

    if (isDateOnly(value)) {
      const [yearText, monthText, dayText] = value.split("-");
      const year = Number(yearText);
      const monthIndex = Number(monthText) - 1;
      const day = Number(dayText);

      const ms = Date.UTC(
        year,
        monthIndex,
        day,
        isEndOfDay ? 23 : 0,
        isEndOfDay ? 59 : 0,
        isEndOfDay ? 59 : 0,
        isEndOfDay ? 999 : 0,
      );

      if (Number.isNaN(ms)) {
        throw new Error(`Invalid date: ${value}`);
      }
      return ms;
    }

    const ms = new Date(value).getTime();
    if (Number.isNaN(ms)) {
      throw new Error(`Invalid date: ${value}`);
    }
    return ms;
  };

  const startMs = parseBoundaryMs(startDate, false);
  const endMs = parseBoundaryMs(endDate, true);

  if (startMs !== null && endMs !== null && startMs > endMs) {
    throw new Error("startDate must be on/before endDate.");
  }

  const normalizedType =
    type === undefined || type === null
      ? null
      : requireNonEmptyString(String(type), "Type").toUpperCase();

  return transactions
    .filter((t) => {
      if (normalizedType && String(t.type).toUpperCase() !== normalizedType) {
        return false;
      }
      const time = new Date(t.date).getTime();
      if (Number.isNaN(time)) return false;
      if (startMs !== null && time < startMs) return false;
      if (endMs !== null && time > endMs) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

module.exports = {
  ensureTransactions,
  addDeposit,
  withdrawal,
  withDrawal,
  transferMoney,
  retrieveTransactionsInRange,
};
