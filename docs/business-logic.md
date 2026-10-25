# Banking Application — Business Logic

## Overview
The application supports banking operations including account creation, deposits, withdrawals, transfers, interest calculation, transaction history, and account security.

## Account Management
- Users can create an account by providing their first and last names and an initial deposit.
- The initial deposit must be at least $50.
- Each account has an account number, customer name, balance, and creation timestamp.

## Transactions
- **Deposit:** Adds money to an account.
- **Withdrawal:** Validates the requested amount and available balance.
- **Transfer:** Moves money between accounts and records the outgoing and incoming transactions.
- **Transaction History:** Retrieves transactions with optional date and type filters, ordered newest first.
- **Interest Calculation:** Applies the configured interest rule implemented by the application.

## Account Security
- Accounts can be frozen or unfrozen with manager authorization.
- Daily withdrawals are subject to a $500 limit.
- Password validation checks length, character variety, and common-password restrictions.
- Suspicious activity checks include transactions above $10,000 and repeated small withdrawals.

## Important Implementation Notes
- An overdraft attempt triggers a $5 penalty in the transaction service.
- The modular interest service and browser-compatible implementation may handle balance updates differently. Verify the active implementation before documenting the exact balance effect.
- These descriptions reflect the supplied source files; they do not establish the existence of REST APIs or a persistent database.
<!-- AUTO-GENERATED: SOURCE FUNCTIONS START -->
## Source function inventory

### `src/services/transactionService.js`

- `addDeposit()`
- `ensureTransactions()`
- `if()`
- `isDateOnly()`
- `parseBoundaryMs()`
- `retrieveTransactionsInRange()`
- `transferMoney()`
- `withdrawal()`

### `src/services/interestService.js`

- `calculateSaving()`
- `if()`

### `src/services/securityService.js`

- `addDepositSafe()`
- `assertAccountNotFrozen()`
- `checkForSuspiciousActivity()`
- `for()`
- `if()`
- `transferMoneySafe()`
- `updateAccountStatus()`
- `validatePassword()`
- `withdrawalWithDailyLimit()`

### `src/models/accountStore.js`

- `generateBankAccount()`
- `generateUniqueAccountNumber()`
- `getAccounts()`
- `if()`

### `src/utils/validators.js`

- `if()`
- `requireNonEmptyString()`
- `requirePositiveNumber()`

<!-- AUTO-GENERATED: SOURCE FUNCTIONS END -->

<!-- AUTO-GENERATED: TRANSACTION RULES START -->
## Transaction service behavior

Source: `src/services/transactionService.js`

### Deposits
- The deposit amount must pass `requirePositiveNumber`.
- The transaction is recorded as `DEPOSIT` with an ISO timestamp and resulting balance.
- The account balance is increased by the deposit amount.

### Withdrawals
- The withdrawal amount must pass `requirePositiveNumber`.
- If the amount exceeds the balance, the withdrawal is not completed.
- An overdraft attempt deducts a penalty of 5 balance units and records `OVERDRAFT_ATTEMPT`.
- Otherwise, the amount is deducted and a `WITHDRAWAL` transaction is recorded.

### Transfers
- Both source and destination accounts must have account numbers.
- The amount must pass `requirePositiveNumber` and cannot exceed the source balance.
- A successful transfer records `TRANSFER_OUT` and `TRANSFER_IN` entries.
- Both accounts' balances and transaction histories are updated.

### Transaction retrieval
- The account argument must be an object.
- Transactions can be filtered by start date, end date, and transaction type.
- Date-only start boundaries use the start of the UTC day; date-only end boundaries use the end of the UTC day.
- Invalid dates and a start date later than the end date cause errors.
- Results are sorted newest first; transactions with invalid dates are excluded.

<!-- AUTO-GENERATED: TRANSACTION RULES END -->
