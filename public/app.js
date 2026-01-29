// -------- Approved recipients source (prefer API, then localStorage, fall back to built-in) --------
const builtinApprovedRecipients = [
  { label: "Daughter (9123 4567)", value: "91234567" },
  { label: "Son (8765 4321)", value: "87654321" },
  { label: "Helper (S1234567A)", value: "S1234567A" }
];

async function loadApprovedRecipientsFromAPI() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const response = await fetch('/api/approved-recipients', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (!response.ok) return null;
    const data = await response.json();
    const list = data.approvedRecipients || data;
    
    // Cache to localStorage
    if (Array.isArray(list) && list.length > 0) {
      localStorage.setItem('approvedRecipients', JSON.stringify(list));
      return list;
    }
    return null;
  } catch (e) {
    console.warn('Failed to load approved recipients from API:', e);
    return null;
  }
}

function getApprovedRecipients() {
  try {
    const raw = localStorage.getItem('approvedRecipients');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed.map(r => ({ label: r.label || r.Label || r.value || '', value: String(r.value || r.Value || r).replace(/\D/g, '') }));
    }
  } catch (e) {}
  return builtinApprovedRecipients.map(r => ({ label: r.label || '', value: String(r.value || '').replace(/\D/g, '') }));
}

const allBillers = [
  "SP Group (Electricity)",
  "Singtel",
  "StarHub",
  "Town Council",
  "CPF Contribution",
  "Hospital Bill",
  "Water (PUB)"
];

const approvedBillers = [
  "SP Group (Electricity)",
  "Town Council",
  "CPF Contribution"
];

// -------- Utilities --------
const $ = (sel) => document.querySelector(sel);
const show = (el) => el && el.classList.add("show");
const hide = (el) => el && el.classList.remove("show");

function formatCurrency(n) {
  if (n === "" || n === null || n === undefined) return "-";
  const val = Number(n);
  if (isNaN(val)) return n;
  return val.toLocaleString("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 2
  });
}

function ttsSpeak(text) {
  try {
    if (!window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-SG";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

// -------- Safe Mode wiring --------
const safeToggle = $("#safemode");
const recipientInput = $("#recipient");
const recipientSelect = $("#recipient-select");
const billerSelect = $("#biller");

async function populateRecipientsSafeMode(enabled) {
  if (!recipientInput || !recipientSelect) return;
  if (enabled) {
    // Try to load fresh data from API first
    await loadApprovedRecipientsFromAPI();
    
    recipientSelect.innerHTML = "";
    const list = getApprovedRecipients();
    list.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.value;
      opt.textContent = r.label || r.value;
      recipientSelect.appendChild(opt);
    });
    recipientInput.hidden = true;
    recipientInput.setAttribute("aria-hidden", "true");
    recipientSelect.hidden = false;
    recipientSelect.removeAttribute("aria-hidden");
  } else {
    recipientInput.hidden = false;
    recipientInput.removeAttribute("aria-hidden");
    recipientSelect.hidden = true;
    recipientSelect.setAttribute("aria-hidden", "true");
  }
}

function populateBillersSafeMode(enabled) {
  if (!billerSelect) return;
  billerSelect.innerHTML = "";
  const list = enabled ? approvedBillers : allBillers;
  billerSelect.appendChild(new Option("— Choose —", ""));
  list.forEach((b) => billerSelect.appendChild(new Option(b, b)));
}

if (safeToggle) {
  // Initialize Safe Mode as ON by default
  try {
    const stored = localStorage.getItem('safeMode');
    if (stored === null) {
      // First time - enable Safe Mode by default
      localStorage.setItem('safeMode', 'true');
      safeToggle.checked = true;
    } else if (stored === 'true') {
      safeToggle.checked = true;
    } else if (stored === 'false') {
      safeToggle.checked = false;
    }
  } catch (e) {}

  safeToggle.addEventListener("change", () => {
    const enabled = safeToggle.checked;
    // persist preference
    try { localStorage.setItem('safeMode', enabled ? 'true' : 'false'); } catch (e) {}
    populateRecipientsSafeMode(enabled);
    populateBillersSafeMode(enabled);
    ttsSpeak(
      enabled
        ? "Safe mode on. Only approved contacts and billers."
        : "Safe mode off. All recipients and billers available."
    );
  });
  // Initial population
  populateRecipientsSafeMode(safeToggle.checked);
  populateBillersSafeMode(safeToggle.checked);
}

// -------- Quick amount chips --------
document.querySelectorAll(".chip[data-amt]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const amt = btn.getAttribute("data-amt");
    const amountField = $("#amount");
    const billAmountField = $("#bill-amount");
    if (amountField) amountField.value = amt;
    if (billAmountField) billAmountField.value = amt;
  });
});

// -------- Validators --------
function validMobile(value) {
  return /^[0-9]{8}$/.test(value); // basic SG 8-digit check
}
function validNRIC(value) {
  return /^[STFG]\d{7}[A-Z]$/i.test(value); // rough format check
}
function isApprovedRecipient(val) {
  const list = getApprovedRecipients();
  return list.some((r) => String(r.value) === String(val));
}

// -------- PayNow flow --------
const confirmPaynowDialog = $("#confirm-paynow");
const confirmSafeChk = $("#confirm-safe");
const sendPaynowBtn = $("#send-paynow");

// -------- Store PayNow form data and redirect --------
const paynowForm = document.querySelector("form");
if (paynowForm) {
  paynowForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const method = document.getElementById("method")?.value || "";
    const recipient =
      document.getElementById("recipient")?.value ||
      document.getElementById("recipient-select")?.value ||
      "";
    const amount = document.getElementById("amount")?.value || "";
    const purpose = document.getElementById("purpose")?.value || "";

    if (!recipient || !amount || Number(amount) < 1) {
      alert("Please enter a valid recipient and amount.");
      return;
    }

    // Save to localStorage
    localStorage.setItem("paynow_method", method);
    localStorage.setItem("paynow_recipient", recipient);
    localStorage.setItem("paynow_amount", amount);
    localStorage.setItem("paynow_purpose", purpose);

    // Redirect to confirm page
    window.location.href = "confirm-paynow.html";
  });
}

// -------- Display PayNow details on confirm-paynow.html --------
window.addEventListener("DOMContentLoaded", function () {
  const methodEl = document.getElementById("confirm-method");
  const recipientEl = document.getElementById("confirm-recipient");
  const amountEl = document.getElementById("confirm-amount");
  const purposeEl = document.getElementById("confirm-purpose");

  if (methodEl && recipientEl && amountEl) {
    const method = localStorage.getItem("paynow_method");
    const recipient = localStorage.getItem("paynow_recipient");
    const amount = localStorage.getItem("paynow_amount");
    const purpose = localStorage.getItem("paynow_purpose");

    if (method || recipient || amount) {
      methodEl.textContent = method || "(none)";
      recipientEl.textContent = recipient || "(none)";
      amountEl.textContent = isNaN(amount)
        ? amount
        : `SGD ${parseFloat(amount).toFixed(2)}`;
      if (purposeEl) {
        purposeEl.textContent = purpose || "—";
      }
    }
  }
});

// Handle the final Confirm & Send action on confirm-paynow.html
const sendBtn = $("#send-paynow");
if (sendBtn) {
  sendBtn.addEventListener('click', async function(e) {
    // read safe mode from localStorage or checkbox
    const safeStored = (localStorage.getItem('safeMode') === 'true');
    const safeUi = safeToggle && safeToggle.checked;
    const safe = safeStored || safeUi;
    const recipient = localStorage.getItem('paynow_recipient') || '';
    const normalized = String(recipient).replace(/\D/g, '');
    if (safe && !isApprovedRecipient(normalized)) {
      alert('Safe Mode is enabled — transactions are limited to approved recipients. Add this recipient to your approved list or disable Safe Mode.');
      return;
    }
    
    // Get transfer details from localStorage
    const amount = parseFloat(localStorage.getItem('paynow_amount'));
    const method = localStorage.getItem('paynow_method');
    const description = `PayNow to ${recipient} via ${method}`;
    
    // Debug logging
    console.log('Transfer details:', { recipient, amount, method, description });
    
    // Validate
    if (!amount || amount <= 0) {
      alert('Invalid transfer amount');
      return;
    }
    
    if (!recipient) {
      alert('Invalid recipient');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      console.log('Token exists:', !!token);
      
      if (!token) {
        alert('Session expired - please login again');
        window.location.href = 'login.html';
        return;
      }
      
      const requestBody = {
        amount,
        toAccountNumber: recipient,
        description
      };
      
      console.log('Sending transfer request:', requestBody);
      
      // Call the transfer API
      const response = await fetch('/account/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Transfer successful:', data);
        
        // Clear localStorage items
        localStorage.removeItem('paynow_method');
        localStorage.removeItem('paynow_recipient');
        localStorage.removeItem('paynow_amount');
        localStorage.removeItem('paynow_purpose');
        
        // Proceed to success page
        window.location.href = 'success.html';
      } else {
        const error = await response.json();
        console.error('Transfer failed:', error);
        alert(`Transfer failed: ${error.error || error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Transfer failed. Please try again.');
    }
  });
}

// -------- Bills flow (unchanged) --------
const confirmBillDialog = $("#confirm-bill");
const confirmBillSafeChk = $("#confirm-bill-safe");
const sendBillBtn = $("#send-bill");

const billsContinue = $("#bills-continue");
if (billsContinue) {
  billsContinue.addEventListener("click", () => {
    const biller = $("#biller")?.value || "";
    const ref = $("#accref")?.value.trim() || "";
    const amount = $("#bill-amount")?.value.trim() || "";
    const schedule = $("#schedule")?.value || "Pay Now";

    if (!biller || !ref || !amount || Number(amount) < 1) {
      alert("Please complete biller, reference and amount.");
      return;
    }

    $("#c-biller").textContent = biller;
    $("#c-ref").textContent = ref;
    $("#c-bamount").textContent = formatCurrency(amount);
    $("#c-schedule").textContent = schedule;

    if (confirmBillSafeChk && sendBillBtn && confirmBillDialog) {
      confirmBillSafeChk.checked = false;
      sendBillBtn.disabled = true;
      show(confirmBillDialog);
      ttsSpeak(
        "Please confirm your bill payment. Verify biller and reference number."
      );
    }
  });
}

if (confirmBillSafeChk && sendBillBtn) {
  confirmBillSafeChk.addEventListener("change", () => {
    sendBillBtn.disabled = !confirmBillSafeChk.checked;
  });
}

const backBillBtn = $("#back-bill");
if (backBillBtn && confirmBillDialog) {
  backBillBtn.addEventListener("click", () => hide(confirmBillDialog));
}

if (sendBillBtn) {
  sendBillBtn.addEventListener("click", () => {
    hide(confirmBillDialog);
    show($("#success"));
    ttsSpeak("Your bill payment has been submitted successfully.");
  });
}

// -------- Success dialog actions --------
const newTxnBtn = $("#new-txn");
const closeSuccessBtn = $("#close-success");
if (newTxnBtn) {
  newTxnBtn.addEventListener("click", () => {
    hide($("#success"));
    $("form")?.reset();
    if (safeToggle) {
      populateRecipientsSafeMode(safeToggle.checked);
      populateBillersSafeMode(safeToggle.checked);
    }
  });
}
if (closeSuccessBtn) {
  closeSuccessBtn.addEventListener("click", () => hide($("#success")));
}

// -------- Help buttons (mock) --------
$("#paynow-help")?.addEventListener("click", () =>
  alert("Help: Speak to support at 1800-XXX-XXXX or ask our AI assistant.")
);
$("#bills-help-btn")?.addEventListener("click", () =>
  alert("Help: Check your bill reference on the invoice. Call support if unsure.")
);
