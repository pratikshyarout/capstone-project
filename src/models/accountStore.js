/**
 * Account store — manages the in-memory accounts array and account creation.
 */

const { requireNonEmptyString } = require("../utils/validators");

const accounts = [];

/**
 * Generates a unique 10-digit account number.
 * @returns {string} A unique account number.
 */
function generateUniqueAccountNumber() {
  let accountNumber;
  do {
    accountNumber = String(Math.floor(Math.random() * 9000000000) + 1000000000);
  } while (accounts.some((acc) => acc.accountNumber === accountNumber));
  return accountNumber;
}

/**
 * Creates and stores a new bank account.
 * @param {Object} accountData - Data for the new account.
 * @param {string} accountData.firstName - Account holder's first name.
 * @param {string} accountData.lastName  - Account holder's last name.
 * @param {number} accountData.initialDeposit - Opening deposit (min $50).
 * @returns {Object} The newly created account.
 */
function generateBankAccount(accountData) {
  if (!accountData || typeof accountData !== "object") {
    throw new Error("Account data is required.");
  }

  const firstName = requireNonEmptyString(accountData.firstName, "First name");
  const lastName = requireNonEmptyString(accountData.lastName, "Last name");

  if (
    typeof accountData.initialDeposit !== "number" ||
    Number.isNaN(accountData.initialDeposit)
  ) {
    throw new Error("Initial deposit must be a number.");
  }
  if (accountData.initialDeposit < 50) {
    throw new Error("The initial deposit must be at least $50.");
  }

  const newAccount = {
    accountNumber: generateUniqueAccountNumber(),
    firstName,
    lastName,
    balance: accountData.initialDeposit,
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  return newAccount;
}

/**
 * Returns a reference to the accounts array.
 * @returns {Array} All accounts.
 */
function getAccounts() {
  return accounts;
}

module.exports = { accounts, generateBankAccount, getAccounts };
