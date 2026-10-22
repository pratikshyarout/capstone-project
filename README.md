<p align="center">
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="MIT License" />
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square" alt="Status" />
</p>

# BankSys — Banking System Dashboard

A full-featured banking system built in **vanilla JavaScript** with a modular Node.js backend and a professional browser-based dashboard. Supports account management, transactions, security controls, and real-time activity monitoring — all without external frameworks.

---

## Preview

<p align="center">
  <img src="assets/dashboard-preview.png" alt="BankSys Dashboard Preview" width="100%" />
</p>

---

## Highlights

- **10 banking functions** — create accounts, deposit, withdraw, transfer, calculate interest, retrieve transactions, freeze/unfreeze, daily limits, password validation, suspicious activity detection
- **Interactive dashboard** — Silver / Platinum Gray themed UI with toast notifications, live stats, and animated cards
- **Modular architecture** — clean separation into validators, models, and services
- **Zero dependencies** — the frontend is pure HTML / CSS / JS; the backend only uses Node.js built-ins

---

## Project Structure

```
Banking-System-JS/
├── public/                          # Frontend (browser) application
│   ├── index.html                   #   Dashboard page
│   ├── css/
│   │   └── style.css                #   Design system (Silver / Platinum theme)
│   └── js/
│       ├── banking.js               #   Browser-compatible IIFE of all logic
│       └── app.js                   #   UI controller & event wiring
│
├── src/                             # Backend (Node.js) modules
│   ├── index.js                     #   Entry point & demo
│   ├── utils/
│   │   └── validators.js            #   Input validation helpers
│   ├── models/
│   │   └── accountStore.js          #   Account creation & in-memory storage
│   └── services/
│       ├── transactionService.js    #   Deposit, withdrawal, transfer, retrieval
│       ├── interestService.js       #   Monthly compound interest
│       └── securityService.js       #   Freeze, limits, passwords, alerts
│
├── assets/                          # Static assets
│   └── dashboard-preview.png        #   Dashboard screenshot for README
├── scripts/                         # Utility scripts
│   └── screenshot.js                #   Captures dashboard screenshot
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18 (only needed for the CLI demo & `nodemon`)

### Install

```bash
git clone https://github.com/masy43/Banking-System-JS.git
cd Banking-System-JS
npm install
```

### Run the CLI Demo

```bash
npm start          # run once
npm run dev        # auto-restart on changes (nodemon)
```

### Launch the Dashboard

```bash
npm run serve      # opens at http://localhost:3456
```

Then visit **http://localhost:3456** in your browser.

---

## Features

| #   | Feature                      | Description                                                      | Module                  |
| --- | ---------------------------- | ---------------------------------------------------------------- | ----------------------- |
| 1   | **Create Account**           | Open a new account with validated name & initial deposit (≥ $50) | `accountStore.js`       |
| 2   | **Deposit**                  | Add funds with full transaction recording                        | `transactionService.js` |
| 3   | **Withdrawal**               | Withdraw with overdraft protection ($5 penalty on attempt)       | `transactionService.js` |
| 4   | **Transfer**                 | Move funds between two accounts atomically                       | `transactionService.js` |
| 5   | **Interest Calculation**     | Monthly compound interest (0.167 %/mo for balances > $500)       | `interestService.js`    |
| 6   | **Transaction Retrieval**    | Query by date range and/or transaction type                      | `transactionService.js` |
| 7   | **Freeze / Unfreeze**        | Manager-approved account status control                          | `securityService.js`    |
| 8   | **Daily Withdrawal Limit**   | Enforces a $500/day withdrawal cap                               | `securityService.js`    |
| 9   | **Password Validation**      | Strength meter (length, case, digits, symbols, spaces)           | `securityService.js`    |
| 10  | **Suspicious Activity Scan** | Detects anomalous transaction patterns                           | `securityService.js`    |

---

## API Reference

### Account Management

```js
const {
  generateBankAccount,
  getAccounts,
} = require("./src/models/accountStore");

// Create an account (returns account object)
const account = generateBankAccount({
  firstName: "John",
  lastName: "Doe",
  initialDeposit: 100, // minimum $50
});

// List all accounts
getAccounts();
```

### Transactions

```js
const {
  addDeposit,
  withdrawal,
  transferMoney,
  retrieveTransactionsInRange,
} = require("./src/services/transactionService");

addDeposit(account, 250); // deposit $250
withdrawal(account, 80); // withdraw $80
transferMoney(accountA, accountB, 50); // transfer $50

// Retrieve filtered transactions
retrieveTransactionsInRange(account, {
  startDate: "2026-01-01",
  endDate: "2026-01-31",
  type: "DEPOSIT", // DEPOSIT | WITHDRAWAL | TRANSFER_IN | TRANSFER_OUT
});
```

### Interest

```js
const { calculateSaving } = require("./src/services/interestService");

calculateSaving(account);
// → { accountNumber, balance, interestApplied } (if balance > $500)
// → { accountNumber, balance, message }          (if balance ≤ $500)
```

### Security

```js
const {
  updateAccountStatus,
  withdrawalWithDailyLimit,
  validatePassword,
  checkForSuspiciousActivity,
} = require("./src/services/securityService");

updateAccountStatus(account, "FREEZE", "MGR-001"); // requires manager ID
updateAccountStatus(account, "UNFREEZE");

withdrawalWithDailyLimit(account, 100); // enforces $500/day

validatePassword("Str0ng!Pass#2026");
// → { valid: true }
// → { valid: false, reasons: [...] }

checkForSuspiciousActivity(account);
// → { isSuspicious: false }
// → { isSuspicious: true, alerts: [...] }
```

---

## Tech Stack

| Layer     | Technology                                                        |
| --------- | ----------------------------------------------------------------- |
| Frontend  | HTML5, CSS3 (custom properties), vanilla JS                       |
| Backend   | Node.js (CommonJS modules)                                        |
| Font      | [Inter](https://fonts.google.com/specimen/Inter) via Google Fonts |
| Icons     | Inline SVG (Feather-style)                                        |
| Dev tools | nodemon, npx serve                                                |

---

## Design System

The dashboard uses a **Silver / Platinum Gray** palette (`#E5E7EB` → `#6B7280`) with an **Indigo** accent (`#6366F1`).

| Token        | Value     |
| ------------ | --------- |
| `--gray-50`  | `#f9fafb` |
| `--gray-200` | `#e5e7eb` |
| `--gray-500` | `#6b7280` |
| `--gray-900` | `#111827` |
| `--accent`   | `#6366f1` |

All colors, radii, shadows, and transitions are managed through CSS custom properties in `public/css/style.css`.

---

## License

This project is licensed under the [MIT License](LICENSE).
