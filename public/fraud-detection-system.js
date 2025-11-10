// Load/define approvedRecipients safely (try API, then localStorage, then defaults)
const defaultApprovedRecipients = [
  { id: 1, label: 'Self - Mobile', value: '91234567' },
  { id: 2, label: 'Partner - Mobile', value: '98765432' }
];

let approvedRecipients = [];

function normalizeNumber(input) {
  return String(input || '').replace(/\D/g, '');
}

async function loadApprovedRecipientsFromApi() {
  try {
    const resp = await fetch('/api/approved-recipients');
    if (!resp.ok) throw new Error('api error');
    const data = await resp.json();
    return (Array.isArray(data) ? data : []).map(r => {
      if (typeof r === 'string') return { value: normalizeNumber(r) };
      if (r && typeof r.value === 'string') return { ...r, value: normalizeNumber(r.value) };
      return { value: normalizeNumber(String(r)) };
    });
  } catch (err) {
    console.warn('API load failed, falling back to localStorage/defaults', err);
    return null;
  }
}

(async function loadApprovedRecipients() {
  try {
    const apiList = await loadApprovedRecipientsFromApi();
    if (apiList && apiList.length) {
      approvedRecipients = apiList;
      // Optionally persist a copy in localStorage
      localStorage.setItem('approvedRecipients', JSON.stringify(approvedRecipients));
      return;
    }

    const raw = localStorage.getItem('approvedRecipients');
    if (raw) {
      approvedRecipients = JSON.parse(raw);
    } else {
      approvedRecipients = defaultApprovedRecipients;
      localStorage.setItem('approvedRecipients', JSON.stringify(approvedRecipients));
    }

    approvedRecipients = approvedRecipients.map(r => {
      if (typeof r === 'string') return { value: normalizeNumber(r) };
      if (r && typeof r.value === 'string') return { ...r, value: normalizeNumber(r.value) };
      return { value: normalizeNumber(String(r)) };
    });
  } catch (err) {
    console.error('Failed to load approvedRecipients:', err);
    approvedRecipients = defaultApprovedRecipients.map(r => ({ value: normalizeNumber(r.value) }));
  }
})();


function checkHighRiskTransaction(method, recipient, amount, purpose) {
  let riskScore = 0;

  const normalizedRecipient = normalizeNumber(recipient);
  const numericAmount = Number(amount);

  if (Number.isFinite(numericAmount) && numericAmount >= 1000) riskScore += 2;
  if (!approvedRecipients.some(r => r.value === normalizedRecipient)) riskScore += 2;
  if (String(purpose).toLowerCase().includes("secure") || String(purpose).toLowerCase().includes("refund") || String(purpose).toLowerCase().includes("loan")) riskScore += 3;

  // Simulate time-based risk
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 5) riskScore += 1;

  return riskScore;
}

document.querySelector("form")?.addEventListener("submit", function (e) {
  e.preventDefault();

  const methodEl = document.getElementById("method");
  const recipientEl = document.getElementById("recipient");
  const amountEl = document.getElementById("amount");
  const purposeEl = document.getElementById("purpose");

  if (!recipientEl || !amountEl || !methodEl) return;

  const method = methodEl.value;
  const recipient = recipientEl.value;
  const amount = amountEl.value;
  const purpose = purposeEl ? purposeEl.value : "";

  // ATM constraint: recipient must contain only digits (no letters or symbols)
  if (!/^\d+$/.test(recipient)) {
    alert("Recipient must contain only numbers (digits 0-9). Remove spaces, letters or symbols.");
    // focus the field so user can correct
    recipientEl.focus();
    return;
  }

  const risk = checkHighRiskTransaction(method, recipient, amount, purpose);

  if (risk >= 3) {
    alert("⚠️ Warning: This transaction looks unusual and may be a scam.\nPlease verify the recipient or contact your bank for help.");
    if (typeof ttsSpeak === "function") {
      ttsSpeak("Warning. This transaction looks unusual and may be a scam. Please check before sending.");
    }
    // allow user to decide; don't auto-cancel here (keeps previous behavior)
  }

  // Save and redirect as before; persist normalized recipient (digits only)
  localStorage.setItem("paynow_method", method);
  localStorage.setItem("paynow_recipient", normalizeNumber(recipient));
  localStorage.setItem("paynow_amount", amount);
  localStorage.setItem("paynow_purpose", purpose);

  window.location.href = "confirm-paynow.html";
});