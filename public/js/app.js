/**
 * Banking System — UI Controller
 * Wires the HTML forms to BankingSystem functions and renders results.
 */

document.addEventListener("DOMContentLoaded", () => {
  const BS = BankingSystem;

  // ── Helpers ──────────────────────────────────────────────────────────────

  function $(sel) {
    return document.querySelector(sel);
  }
  function $$(sel) {
    return document.querySelectorAll(sel);
  }

  function showResult(id, data, type = "success") {
    const box = $(`#${id}`);
    box.className = `result-box visible ${type}`;
    box.textContent =
      typeof data === "string" ? data : JSON.stringify(data, null, 2);
  }

  function num(id) {
    const v = parseFloat($(`#${id}`).value);
    return isNaN(v) ? undefined : v;
  }

  function str(id) {
    return $(`#${id}`).value.trim();
  }

  function getSelectedAccount(selectId) {
    const idx = parseInt($(`#${selectId}`).value, 10);
    if (isNaN(idx)) return null;
    return BS.getAccounts()[idx] || null;
  }

  // ── Toast Notifications ─────────────────────────────────────────────────

  function toast(message, type = "success") {
    const container = $("#toastContainer");
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    const icon =
      type === "success"
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    el.innerHTML = icon + `<span>${message}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateX(20px)";
      el.style.transition = ".3s ease";
      setTimeout(() => el.remove(), 300);
    }, 3000);
  }

  // ── Header Stats ────────────────────────────────────────────────────────

  function updateHeaderStats() {
    const accounts = BS.getAccounts();
    const total = accounts.reduce((s, a) => s + a.balance, 0);
    $("#headerTotalAccounts").textContent = accounts.length;
    $("#headerTotalBalance").textContent =
      `$${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    $("#accountCountBadge").textContent =
      `${accounts.length} account${accounts.length !== 1 ? "s" : ""}`;
  }

  // ── Account Chips ───────────────────────────────────────────────────────

  function refreshAccountChips() {
    const bar = $("#accountChips");
    bar.innerHTML = "";
    BS.getAccounts().forEach((a) => {
      const frozen = a.status === "FROZEN";
      const initials = (a.firstName[0] + a.lastName[0]).toUpperCase();
      bar.insertAdjacentHTML(
        "beforeend",
        `<div class="account-chip" title="#${a.accountNumber}">
          <span class="status-dot ${frozen ? "frozen" : ""}"></span>
          <div class="chip-avatar">${initials}</div>
          <div class="chip-info">
            <span class="chip-name">${a.firstName} ${a.lastName}</span>
            <span class="chip-number">${a.accountNumber}</span>
          </div>
          <span class="chip-balance">$${a.balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>`,
      );
    });
    refreshSelects();
    updateHeaderStats();
  }

  function refreshSelects() {
    const selects = $$("select.account-select");
    const accounts = BS.getAccounts();
    selects.forEach((sel) => {
      const prev = sel.value;
      sel.innerHTML = '<option value="">Select an account</option>';
      accounts.forEach((a, i) => {
        const frozen = a.status === "FROZEN" ? " [FROZEN]" : "";
        sel.insertAdjacentHTML(
          "beforeend",
          `<option value="${i}">${a.firstName} ${a.lastName} (#${a.accountNumber.slice(-4)}) — $${a.balance.toFixed(2)}${frozen}</option>`,
        );
      });
      if (prev) sel.value = prev;
    });
  }

  // ── 1) Create Account ───────────────────────────────────────────────────

  $("#btnCreateAccount").addEventListener("click", () => {
    try {
      const result = BS.generateBankAccount({
        firstName: str("caFirstName"),
        lastName: str("caLastName"),
        initialDeposit: num("caDeposit"),
      });
      showResult("resCreateAccount", result, "success");
      toast(`Account created for ${result.firstName} ${result.lastName}`);
      refreshAccountChips();
    } catch (e) {
      showResult("resCreateAccount", e.message, "error");
      toast(e.message, "error");
    }
  });

  // ── 2) Deposit ──────────────────────────────────────────────────────────

  $("#btnDeposit").addEventListener("click", () => {
    try {
      const acct = getSelectedAccount("depAccount");
      if (!acct) throw new Error("Select an account first.");
      const amount = num("depAmount");
      const result = BS.addDeposit(acct, amount);
      showResult(
        "resDeposit",
        {
          accountNumber: result.accountNumber,
          balance: result.balance,
          lastTransaction: result.transactions.slice(-1)[0],
        },
        "success",
      );
      toast(`$${amount.toFixed(2)} deposited successfully`);
      refreshAccountChips();
    } catch (e) {
      showResult("resDeposit", e.message, "error");
      toast(e.message, "error");
    }
  });

  // ── 3) Withdrawal ──────────────────────────────────────────────────────

  $("#btnWithdraw").addEventListener("click", () => {
    try {
      const acct = getSelectedAccount("wdAccount");
      if (!acct) throw new Error("Select an account first.");
      const result = BS.withdrawal(acct, num("wdAmount"));
      const last = result.transactions.slice(-1)[0];
      const type = last.type === "OVERDRAFT_ATTEMPT" ? "warning" : "success";
      showResult(
        "resWithdraw",
        {
          accountNumber: result.accountNumber,
          balance: result.balance,
          lastTransaction: last,
        },
        type,
      );
      if (last.type === "OVERDRAFT_ATTEMPT") {
        toast("Overdraft attempt — $5 penalty applied", "error");
      } else {
        toast(`$${last.amount.toFixed(2)} withdrawn successfully`);
      }
      refreshAccountChips();
    } catch (e) {
      showResult("resWithdraw", e.message, "error");
      toast(e.message, "error");
    }
  });

  // ── 4) Transfer ─────────────────────────────────────────────────────────

  $("#btnTransfer").addEventListener("click", () => {
    try {
      const from = getSelectedAccount("trFrom");
      const to = getSelectedAccount("trTo");
      if (!from || !to) throw new Error("Select both accounts.");
      if (from === to) throw new Error("Cannot transfer to the same account.");
      const amount = num("trAmount");
      const result = BS.transferMoney(from, to, amount);
      showResult(
        "resTransfer",
        result.map((r) => ({
          accountNumber: r.accountNumber,
          balance: r.balance,
        })),
        "success",
      );
      toast(`$${amount.toFixed(2)} transferred successfully`);
      refreshAccountChips();
    } catch (e) {
      showResult("resTransfer", e.message, "error");
      toast(e.message, "error");
    }
  });

  // ── 5) Interest ─────────────────────────────────────────────────────────

  $("#btnInterest").addEventListener("click", () => {
    try {
      const acct = getSelectedAccount("intAccount");
      if (!acct) throw new Error("Select an account first.");
      const result = BS.calculateSaving(acct);
      const type = result.message ? "warning" : "success";
      showResult(
        "resInterest",
        {
          accountNumber: result.accountNumber,
          balance: result.balance,
          ...(result.interestApplied !== undefined
            ? { interestApplied: `$${result.interestApplied.toFixed(4)}` }
            : {}),
          ...(result.message ? { message: result.message } : {}),
        },
        type,
      );
      if (result.interestApplied) {
        toast(`Interest of $${result.interestApplied.toFixed(4)} applied`);
      } else {
        toast("Balance too low for interest", "error");
      }
      refreshAccountChips();
    } catch (e) {
      showResult("resInterest", e.message, "error");
      toast(e.message, "error");
    }
  });

  // ── 6) Retrieve Transactions ────────────────────────────────────────────

  $("#btnRetrieve").addEventListener("click", () => {
    try {
      const acct = getSelectedAccount("rtAccount");
      if (!acct) throw new Error("Select an account first.");
      const options = {};
      const s = str("rtStart");
      const e = str("rtEnd");
      const t = str("rtType");
      if (s) options.startDate = s;
      if (e) options.endDate = e;
      if (t) options.type = t;
      const result = BS.retrieveTransactionsInRange(acct, options);
      showResult(
        "resRetrieve",
        result.length ? result : "No transactions found.",
        result.length ? "info" : "warning",
      );
      toast(`${result.length} transaction(s) found`);
    } catch (e) {
      showResult("resRetrieve", e.message, "error");
      toast(e.message, "error");
    }
  });

  // ── 7) Freeze / Unfreeze ───────────────────────────────────────────────

  $("#btnFreeze").addEventListener("click", () => {
    try {
      const acct = getSelectedAccount("fsAccount");
      if (!acct) throw new Error("Select an account first.");
      const result = BS.updateAccountStatus(acct, "FREEZE", str("fsManagerId"));
      showResult("resFreeze", result, "info");
      toast("Account frozen successfully");
      refreshAccountChips();
    } catch (e) {
      showResult("resFreeze", e.message, "error");
      toast(e.message, "error");
    }
  });

  $("#btnUnfreeze").addEventListener("click", () => {
    try {
      const acct = getSelectedAccount("fsAccount");
      if (!acct) throw new Error("Select an account first.");
      const result = BS.updateAccountStatus(acct, "UNFREEZE");
      showResult("resFreeze", result, "success");
      toast("Account unfrozen successfully");
      refreshAccountChips();
    } catch (e) {
      showResult("resFreeze", e.message, "error");
      toast(e.message, "error");
    }
  });

  // ── 8) Daily-Limited Withdrawal ─────────────────────────────────────────

  $("#btnDailyWd").addEventListener("click", () => {
    try {
      const acct = getSelectedAccount("dlAccount");
      if (!acct) throw new Error("Select an account first.");
      const amount = num("dlAmount");
      const result = BS.withdrawalWithDailyLimit(acct, amount);
      showResult(
        "resDailyWd",
        {
          accountNumber: result.accountNumber,
          balance: result.balance,
          lastTransaction: result.transactions.slice(-1)[0],
        },
        "success",
      );
      toast(`$${amount.toFixed(2)} withdrawn (within daily limit)`);
      refreshAccountChips();
    } catch (e) {
      showResult("resDailyWd", e.message, "error");
      toast(e.message, "error");
    }
  });

  // ── 9) Password Validation ─────────────────────────────────────────────

  const pwInput = $("#pvPassword");
  const strengthLabel = $("#strengthLabel");
  const strengthLabels = [
    "Very Weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
    "Excellent",
  ];
  const strengthColors = [
    "#dc2626",
    "#f97316",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#059669",
  ];

  function runPasswordCheck() {
    const pw = pwInput.value;
    if (!pw) {
      $("#resPwValidate").className = "result-box";
      updateStrengthBar(0);
      strengthLabel.textContent = "Enter a password";
      strengthLabel.style.color = "var(--gray-400)";
      return;
    }
    const result = BS.validatePassword(pw);
    if (result.valid) {
      showResult("resPwValidate", "Password meets all requirements", "success");
      updateStrengthBar(5);
    } else {
      showResult(
        "resPwValidate",
        "Issues found:\n" + result.reasons.map((r) => `  - ${r}`).join("\n"),
        "warning",
      );
      const passed = 5 - result.reasons.length;
      updateStrengthBar(Math.max(0, passed));
    }
  }

  function updateStrengthBar(score) {
    const fill = $(".strength-bar .fill");
    const pct = (score / 5) * 100;
    fill.style.width = pct + "%";
    fill.style.background = strengthColors[score] || strengthColors[0];
    strengthLabel.textContent = strengthLabels[score] || "Very Weak";
    strengthLabel.style.color = strengthColors[score] || "var(--gray-400)";
  }

  pwInput.addEventListener("input", runPasswordCheck);
  $("#btnPwValidate").addEventListener("click", runPasswordCheck);

  // ── 10) Suspicious Activity ─────────────────────────────────────────────

  $("#btnSuspicious").addEventListener("click", () => {
    try {
      const acct = getSelectedAccount("saAccount");
      if (!acct) throw new Error("Select an account first.");
      const result = BS.checkForSuspiciousActivity(acct);
      if (result.isSuspicious) {
        showResult(
          "resSuspicious",
          { isSuspicious: true, alerts: result.alerts },
          "error",
        );
        toast(`${result.alerts.length} alert(s) detected!`, "error");
      } else {
        showResult(
          "resSuspicious",
          "No suspicious activity detected.",
          "success",
        );
        toast("Account scan clean");
      }
    } catch (e) {
      showResult("resSuspicious", e.message, "error");
      toast(e.message, "error");
    }
  });

  // ── Seed demo accounts ──────────────────────────────────────────────────

  BS.generateBankAccount({
    firstName: "John",
    lastName: "Doe",
    initialDeposit: 1000,
  });
  BS.generateBankAccount({
    firstName: "Jane",
    lastName: "Smith",
    initialDeposit: 2500,
  });
  BS.generateBankAccount({
    firstName: "Alice",
    lastName: "Johnson",
    initialDeposit: 750,
  });
  refreshAccountChips();
});
