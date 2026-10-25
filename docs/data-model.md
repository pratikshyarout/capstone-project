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
