// Prevent double-loading which causes duplicate const/let declarations when the script
// is accidentally included more than once on the same page.
if (window.__fraud_detection_system_loaded) {
  try { console.warn('[fraud] fraud-detection-system.js already loaded; skipping second initialization'); } catch (e) {}
} else {
  window.__fraud_detection_system_loaded = true;

  // Load/define approvedRecipients safely (try API, then localStorage, then defaults)
  const defaultApprovedRecipients = [
  { id: 1, label: 'Self - Mobile', value: '91234567' },
  { id: 2, label: 'Partner - Mobile', value: '98765432' }
];

let approvedRecipients = [];

// Debug: confirm this script is loaded
try { console.log('[fraud] fraud-detection-system.js loaded'); } catch (e) {}

function normalizeNumber(input) {
  return String(input || '').replace(/\D/g, '');
}

async function loadApprovedRecipientsFromApi() {
  try {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const resp = await fetch('/api/approved-recipients', { 
      headers,
      credentials: 'include'
    });
    if (!resp.ok) throw new Error('api error');
    const data = await resp.json();
    
    // Handle both array and object with approvedRecipients property
    const list = data.approvedRecipients || data;
    
    return (Array.isArray(list) ? list : []).map(r => {
      if (typeof r === 'string') return { value: normalizeNumber(r) };
      // Handle both Value (from DB) and value properties
      const val = r.Value || r.value;
      if (val) return { ...r, value: normalizeNumber(val) };
      return { value: normalizeNumber(String(r)) };
    });
  } catch (err) {
    console.warn('API load failed, falling back to localStorage/defaults', err);
    return null;
  }
}

async function loadApprovedRecipients() {
  try {
    const apiList = await loadApprovedRecipientsFromApi();
    if (apiList && apiList.length) {
      approvedRecipients = apiList;
      // Optionally persist a copy in localStorage
      localStorage.setItem('approvedRecipients', JSON.stringify(approvedRecipients));
      console.log('[fraud] Loaded', approvedRecipients.length, 'approved recipients from API');
      return;
    }

    const raw = localStorage.getItem('approvedRecipients');
    if (raw) {
      approvedRecipients = JSON.parse(raw);
      console.log('[fraud] Loaded', approvedRecipients.length, 'approved recipients from localStorage');
    } else {
      approvedRecipients = defaultApprovedRecipients;
      localStorage.setItem('approvedRecipients', JSON.stringify(approvedRecipients));
      console.log('[fraud] Using default approved recipients');
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
}

// Initial load
loadApprovedRecipients();

// Listen for updates to approved recipients list
window.addEventListener('approvedRecipientsUpdated', function() {
  console.log('[fraud] Approved recipients updated, reloading...');
  loadApprovedRecipients();
});


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

// Attach on DOMContentLoaded to be robust; use capture so this runs before app.js handlers
document.addEventListener('DOMContentLoaded', function () {
  var theForm = document.querySelector('form');
  if (!theForm) { try { console.warn('[fraud] form not found on page'); } catch (e) {} ; return; }
  try { console.log('[fraud] attaching submit handler (capture)'); } catch (e) {}
  theForm.addEventListener('submit', function (e) {

  const methodEl = document.getElementById("method");
  const recipientEl = document.getElementById("recipient");
  const amountEl = document.getElementById("amount");
  const purposeEl = document.getElementById("purpose");

  if (!recipientEl || !amountEl || !methodEl) return;

  const method = methodEl.value;
  const recipient = recipientEl.value;
  const amount = amountEl.value;
  const purpose = purposeEl ? purposeEl.value : "";

  try { console.log('[fraud] submit handler running, amount=', amount, ' recipient=', recipient); } catch (e) {}

  // ATM constraint: recipient must contain only digits (no letters or symbols)
  if (!/^\d+$/.test(recipient)) {
    alert("Recipient must contain only numbers (digits 0-9). Remove spaces, letters or symbols.");
    // focus the field so user can correct
    recipientEl.focus();
    // stop other submit handlers (they may redirect)
    try { e.preventDefault(); e.stopImmediatePropagation(); } catch (err) { /* ignore */ }
    return;
  }

  // Immediate high-value warning: amounts >= 1000 should prompt the user.
  const numericAmount = Number(amount);
  if (Number.isFinite(numericAmount) && numericAmount >= 1000) {
    // Block submission until user explicitly confirms for high-value transfers
    if (typeof ttsSpeak === "function") {
      ttsSpeak("Warning. Transactions of one thousand Singapore dollars or more are higher risk. Please verify the recipient and amount.");
    }
    var proceed = confirm("⚠️ Warning: Transactions of SGD 1,000 or more are higher risk. Do you want to continue?");
    if (!proceed) {
      // focus the amount field so user can correct or cancel
      try { amountEl.focus(); } catch (err) { /* ignore */ }
      // prevent other submit handlers from running (like app.js which redirects)
      try { e.preventDefault(); e.stopImmediatePropagation(); } catch (err) { /* ignore */ }
      try { console.log('[fraud] user cancelled high-value confirm'); } catch (e) {}
      return; // stop submission
    }
  }

  const risk = checkHighRiskTransaction(method, recipient, amount, purpose);

  if (risk >= 3) {
    // Auto-enable Safe Mode for protection
    try { localStorage.setItem('safeMode', 'true'); } catch (e) {}
    const safeToggle = document.getElementById('safemode');
    if (safeToggle) {
      safeToggle.checked = true;
      // trigger change handlers in other scripts
      try { safeToggle.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
    }

    alert("⚠️ Warning: This transaction looks unusual and may be a scam. Safe Mode has been enabled to protect your account. Please verify the recipient or contact your bank for help.");
    if (typeof ttsSpeak === "function") {
      ttsSpeak("Warning. This transaction looks unusual and may be a scam. Safe mode is now enabled.");
    }

    // If Safe Mode is enabled, only allow transactions to approved recipients
    const normalizedRecipient = normalizeNumber(recipient);
    const isApproved = approvedRecipients.some(r => String(r.value) === normalizedRecipient);
    if (!isApproved) {
      alert("Safe Mode is active — this recipient is not in your approved recipients list. Add the recipient to your approved list or cancel the transaction.");
      try { e.preventDefault(); e.stopImmediatePropagation(); } catch (err) { /* ignore */ }
      try { recipientEl.focus(); } catch (err) {}
      return;
    }
  }

  // Save and redirect as before; persist normalized recipient (digits only)
  localStorage.setItem("paynow_method", method);
  localStorage.setItem("paynow_recipient", normalizeNumber(recipient));
  localStorage.setItem("paynow_amount", amount);
  localStorage.setItem("paynow_purpose", purpose);

  window.location.href = "confirm-paynow.html";
    }, true);
  });

} // end single-load guard