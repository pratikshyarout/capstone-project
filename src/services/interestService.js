/**
 * Interest service — monthly compound interest for savings accounts.
 */

const { ensureTransactions } = require("./transactionService");

/**
 * Calculates and applies monthly interest on accounts with balance > $500.
 * Interest rate: 0.167 % per month (≈ 2 % APR).
 * @param {Object} account - The savings account.
 * @returns {Object} Account summary with updated balance.
 */
function calculateSaving(account) {
  ensureTransactions(account);

  if (account.balance <= 500) {
    console.log(
      `Your Balance Now is ${account.balance} and it is lower than 500$ so you don't have any interests yet `,
    );
    return {
      accountNumber: account.accountNumber,
      balance: account.balance,
      transactions: account.transactions,
    };
  }

  const interestAmount = account.balance * 0.00167;

  const newTrans = {
    type: "INTEREST",
    amount: interestAmount,
    date: new Date().toISOString(),
    newBalance: account.balance + interestAmount,
  };

  account.transactions.push(newTrans);

  return {
    accountNumber: account.accountNumber,
    balance: account.balance + interestAmount,
    transactions: account.transactions,
  };
}

module.exports = { calculateSaving };
