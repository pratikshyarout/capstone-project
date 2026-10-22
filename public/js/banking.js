/**
 * Banking System — Browser-compatible module.
 * All banking logic bundled for client-side use.
 */

const BankingSystem = (() => {
  // ── Validators ─────────────────────────────────────────────────────────────

  function requireNonEmptyString(value, fieldName) {
    if (typeof value !== "string")
      throw new Error(`${fieldName} must be a string.`);
    const trimmed = value.trim();
    if (!trimmed) throw new Error(`${fieldName} is required.`);
    return trimmed;
  }

  function requirePositiveNumber(value, fieldName) {
    if (typeof value !== "number" || Number.isNaN(value))
      throw new Error(`${fieldName} must be a number.`);
    if (value <= 0) throw new Error(`${fieldName} must be greater than zero.`);
    return value;
  }

  // ── Account Store ──────────────────────────────────────────────────────────

  const accounts = [];

  function generateUniqueAccountNumber() {
    let num;
    do {
      num = String(Math.floor(Math.random() * 9000000000) + 1000000000);
    } while (accounts.some((a) => a.accountNumber === num));
    return num;
  }

  function generateBankAccount(data) {
    if (!data || typeof data !== "object")
      throw new Error("Account data is required.");
    const firstName = requireNonEmptyString(data.firstName, "First name");
    const lastName = requireNonEmptyString(data.lastName, "Last name");
    if (
      typeof data.initialDeposit !== "number" ||
      Number.isNaN(data.initialDeposit)
    )
      throw new Error("Initial deposit must be a number.");
    if (data.initialDeposit < 50)
      throw new Error("The initial deposit must be at least $50.");

    const acct = {
      accountNumber: generateUniqueAccountNumber(),
      firstName,
      lastName,
      balance: data.initialDeposit,
      createdAt: new Date().toISOString(),
    };
    accounts.push(acct);
    return acct;
  }

  function getAccounts() {
    return accounts;
  }

  // ── Transactions ───────────────────────────────────────────────────────────

  function ensureTransactions(account) {
    if (!Array.isArray(account.transactions)) account.transactions = [];
    return account.transactions;
  }

  function addDeposit(account, amount) {
    requirePositiveNumber(amount, "Deposit amount");
    const txns = ensureTransactions(account);
    txns.push({
      type: "DEPOSIT",
      amount,
      date: new Date().toISOString(),
      newBalance: account.balance + amount,
    });
    account.balance += amount;
    return account;
  }

  function withdrawal(account, amount) {
    requirePositiveNumber(amount, "Withdrawal amount");
    const txns = ensureTransactions(account);

    if (amount > account.balance) {
      const penalty = 5;
      account.balance -= penalty;
      txns.push({
        type: "OVERDRAFT_ATTEMPT",
        amount,
        date: new Date().toISOString(),
        penalty,
        newBalance: account.balance,
      });
      return {
        accountNumber: account.accountNumber,
        balance: account.balance,
        transactions: txns,
      };
    }

    account.balance -= amount;
    txns.push({
      type: "WITHDRAWAL",
      amount,
      date: new Date().toISOString(),
      newBalance: account.balance,
    });
    return {
      accountNumber: account.accountNumber,
      balance: account.balance,
      transactions: txns,
    };
  }

  function transferMoney(from, to, amount) {
    if (!from?.accountNumber || !to?.accountNumber)
      throw new Error("Account must be available!");
    requirePositiveNumber(amount, "Amount");
    if (amount > from.balance)
      throw new Error("Insufficient funds for transfer.");

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

  function retrieveTransactionsInRange(account, options = {}) {
    if (!account || typeof account !== "object")
      throw new Error("Account is required.");
    const { startDate, endDate, type } = options;
    const transactions = ensureTransactions(account);

    const isDateOnly = (v) =>
      typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);

    const parseBoundaryMs = (value, isEndOfDay) => {
      if (!value) return null;
      if (isDateOnly(value)) {
        const [y, m, d] = value.split("-").map(Number);
        const ms = Date.UTC(
          y,
          m - 1,
          d,
          isEndOfDay ? 23 : 0,
          isEndOfDay ? 59 : 0,
          isEndOfDay ? 59 : 0,
          isEndOfDay ? 999 : 0,
        );
        if (Number.isNaN(ms)) throw new Error(`Invalid date: ${value}`);
        return ms;
      }
      const ms = new Date(value).getTime();
      if (Number.isNaN(ms)) throw new Error(`Invalid date: ${value}`);
      return ms;
    };

    const startMs = parseBoundaryMs(startDate, false);
    const endMs = parseBoundaryMs(endDate, true);

    if (startMs !== null && endMs !== null && startMs > endMs)
      throw new Error("startDate must be on/before endDate.");

    const normalizedType =
      type === undefined || type === null || type === ""
        ? null
        : requireNonEmptyString(String(type), "Type").toUpperCase();

    return transactions
      .filter((t) => {
        if (normalizedType && String(t.type).toUpperCase() !== normalizedType)
          return false;
        const time = new Date(t.date).getTime();
        if (Number.isNaN(time)) return false;
        if (startMs !== null && time < startMs) return false;
        if (endMs !== null && time > endMs) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // ── Interest ───────────────────────────────────────────────────────────────

  function calculateSaving(account) {
    ensureTransactions(account);
    if (account.balance <= 500) {
      return {
        accountNumber: account.accountNumber,
        balance: account.balance,
        message: `Balance $${account.balance.toFixed(2)} is below $500 — no interest applied.`,
        transactions: account.transactions,
      };
    }
    const interest = account.balance * 0.00167;
    account.transactions.push({
      type: "INTEREST",
      amount: interest,
      date: new Date().toISOString(),
      newBalance: account.balance + interest,
    });
    account.balance += interest;
    return {
      accountNumber: account.accountNumber,
      balance: account.balance,
      interestApplied: interest,
      transactions: account.transactions,
    };
  }

  // ── Security ───────────────────────────────────────────────────────────────

  function updateAccountStatus(account, action, managerId) {
    if (!account || typeof account !== "object")
      throw new Error("Account is required.");
    if (!account.status) account.status = "ACTIVE";
    if (!Array.isArray(account.statusHistory)) account.statusHistory = [];

    const norm = requireNonEmptyString(action, "Action").toUpperCase();
    const hasMgr = typeof managerId === "string" && managerId.trim().length > 0;

    if (norm === "FREEZE" && !hasMgr)
      throw new Error("Manager approval is required to freeze an account.");
    if (norm !== "FREEZE" && norm !== "UNFREEZE")
      throw new Error('Action must be "FREEZE" or "UNFREEZE".');

    const next = norm === "FREEZE" ? "FROZEN" : "ACTIVE";
    if (account.status !== next) {
      account.status = next;
      account.statusHistory.push({
        action: norm,
        by: hasMgr ? managerId.trim() : "system",
        date: new Date().toISOString(),
      });
    }
    return {
      accountNumber: account.accountNumber,
      status: account.status,
      statusHistory: account.statusHistory,
    };
  }

  function assertAccountNotFrozen(account) {
    if (!account.status) account.status = "ACTIVE";
    if (account.status === "FROZEN")
      throw new Error("Account is frozen. Transactions are not allowed.");
  }

  function withdrawalWithDailyLimit(account, amount) {
    assertAccountNotFrozen(account);
    requirePositiveNumber(amount, "Withdrawal amount");
    ensureTransactions(account);

    const todayKey = new Date().toISOString().slice(0, 10);
    const withdrawnToday = account.transactions
      .filter(
        (t) =>
          t.type === "WITHDRAWAL" &&
          typeof t.amount === "number" &&
          String(t.date).slice(0, 10) === todayKey,
      )
      .reduce((s, t) => s + t.amount, 0);

    if (withdrawnToday + amount > 500)
      throw new Error("Daily withdrawal limit exceeded ($500 max)");
    return withdrawal(account, amount);
  }

  function validatePassword(password) {
    const reasons = [];
    if (typeof password !== "string")
      return { valid: false, reasons: ["Password must be a string"] };
    if (password.length < 12)
      reasons.push("Password must be at least 12 characters");
    if (!/[A-Z]/.test(password))
      reasons.push("Password must contain an uppercase letter");
    if (!/[a-z]/.test(password))
      reasons.push("Password must contain a lowercase letter");
    if (!/[0-9]/.test(password)) reasons.push("Password must contain a number");
    if (!/[^A-Za-z0-9]/.test(password))
      reasons.push("Password must contain a special character");

    const common = new Set([
      "password",
      "password123",
      "123456789012",
      "qwertyuiop12",
      "letmein123456",
      "adminadmin123",
      "iloveyou12345",
      "welcome123456",
    ]);
    const low = password.toLowerCase();
    if (common.has(low) || low.includes("password"))
      reasons.push("Password is too common");

    return reasons.length ? { valid: false, reasons } : { valid: true };
  }

  function checkForSuspiciousActivity(account) {
    ensureTransactions(account);
    const alerts = [];

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

    const small = account.transactions
      .filter(
        (t) =>
          t.type === "WITHDRAWAL" &&
          typeof t.amount === "number" &&
          t.amount <= 500,
      )
      .map((t) => ({ ...t, _ms: new Date(t.date).getTime() }))
      .sort((a, b) => a._ms - b._ms);

    const windowMs = 5 * 60 * 1000;
    let flagged = false;
    for (let i = 0; i < small.length && !flagged; i++) {
      for (let j = i + 2; j < small.length; j++) {
        const span = small[j]._ms - small[i]._ms;
        if (span <= windowMs) {
          alerts.push(
            `Rapid withdrawals: ${j - i + 1} transactions within ${Math.max(1, Math.round(span / 60000))} minutes`,
          );
          flagged = true;
          break;
        }
        if (span > windowMs) break;
      }
    }

    return { isSuspicious: alerts.length > 0, alerts };
  }

  function addDepositSafe(account, amount) {
    assertAccountNotFrozen(account);
    return addDeposit(account, amount);
  }

  function transferMoneySafe(from, to, amount) {
    assertAccountNotFrozen(from);
    assertAccountNotFrozen(to);
    return transferMoney(from, to, amount);
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  return {
    accounts,
    getAccounts,
    generateBankAccount,
    addDeposit,
    withdrawal,
    transferMoney,
    retrieveTransactionsInRange,
    calculateSaving,
    updateAccountStatus,
    withdrawalWithDailyLimit,
    validatePassword,
    checkForSuspiciousActivity,
    addDepositSafe,
    transferMoneySafe,
  };
})();
