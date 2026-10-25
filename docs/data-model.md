# Banking Application — Data Model

## Account

The account store maintains account objects in memory.

| Field | Description |
|---|---|
| `accountNumber` | Generated account identifier |
| `firstName` | Customer's first name |
| `lastName` | Customer's last name |
| `balance` | Current account balance |
| `createdAt` | Account creation timestamp |

## Transactions

Transactions record banking activities such as deposits, withdrawals, transfers, and interest calculations.

Transfer operations record corresponding outgoing and incoming transactions. Transaction retrieval supports optional date and transaction-type filters.

## Storage

The supplied account-store implementation uses an in-memory array. The available source does not establish persistent database storage.

## Implementation Considerations

- Account numbers are generated in application code.
- The account-store getter returns the underlying array reference.
- Confirm the exact transaction object fields from the active transaction implementation before expanding this document.


<!-- AUTO-GENERATED: ACCOUNT STORE START -->
## Account store behavior

Source: `src/models/accountStore.js`

### Storage
- Accounts are held in an in-memory array named `accounts`.
- `getAccounts()` returns the accounts array directly.
- This module does not implement persistent database storage.

### Account number generation
- Account numbers are generated as 10-digit strings.
- Generation retries while the number matches an existing account.

### Account creation
- Account data must be an object.
- First and last names must pass `requireNonEmptyString`.
- The initial deposit must be a number and cannot be NaN.
- Initial deposits below 50 are rejected.
- A successful account receives an account number, names, initial balance, and ISO creation timestamp.
- The new account is appended to the in-memory array and returned.

<!-- AUTO-GENERATED: ACCOUNT STORE END -->
