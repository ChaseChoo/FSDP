// ===== ELDERLY-OPTIMIZED EASYATM APPLICATION =====

// -------- Enhanced Mock data for Elderly Users --------
const approvedRecipients = [
  { label: "👩‍👧 Daughter Sarah (9123 4567)", value: "91234567", relation: "daughter" },
  { label: "👨‍👦 Son Michael (8765 4321)", value: "87654321", relation: "son" },
  { label: "🏠 Domestic Helper Mary (S1234567A)", value: "S1234567A", relation: "helper" },
  { label: "🩺 Family Doctor Clinic (6234 5678)", value: "62345678", relation: "medical" },
  { label: "🛒 Regular Grocery Store", value: "grocery123", relation: "merchant" }
];

const allBillers = [
  "⚡ SP Group (Electricity)",
  "📱 Singtel (Mobile)",
  "📺 StarHub (Internet/TV)", 
  "🏘️ Town Council (Conservancy)",
  "💼 CPF Contribution",
  "🏥 Hospital Bills",
  "💧 Water Bill (PUB)",
  "🚗 Car Insurance",
  "🏠 Home Insurance"
];

const approvedBillers = [
  "⚡ SP Group (Electricity)",
  "🏘️ Town Council (Conservancy)", 
  "💼 CPF Contribution",
  "💧 Water Bill (PUB)"
];

// -------- Enhanced Utilities for Elderly Users --------
const $ = (sel) => document.querySelector(sel);
const show = (el) => el && el.classList.add("show");
const hide = (el) => el && el.classList.remove("show");

// Enhanced currency formatting with clearer display
function formatCurrency(n) {
  if (n === "" || n === null || n === undefined) return "-";
  const val = Number(n);
  if (isNaN(val)) return n;
  const formatted = val.toLocaleString("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 2
  });
  return `💰 ${formatted}`; // Add money emoji for visual recognition
}

// Enhanced Text-to-Speech with elderly-friendly settings
function ttsSpeak(text, priority = 'normal') {
  try {
    if (!window.speechSynthesis) {
      console.log("Text-to-Speech not supported");
      return;
    }
    
    // Cancel any ongoing speech for important messages
    if (priority === 'urgent') {
      window.speechSynthesis.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Elderly-friendly speech settings
    utterance.lang = "en-SG";
    utterance.rate = 0.8;  // Slower speech rate
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 0.9; // High volume
    
    // Add pauses for better comprehension
    const pausedText = text.replace(/[,.!?;]/g, '$&... '); // Add pauses after punctuation
    utterance.text = pausedText;
    
    // Provide audio feedback
    utterance.onstart = () => {
      console.log("🔊 Speaking:", text);
    };
    
    utterance.onerror = (error) => {
      console.error("Speech error:", error);
      // Fallback: show visual alert if speech fails
      showVisualAlert(text);
    };
    
    window.speechSynthesis.speak(utterance);
  } catch (error) {
    console.error("TTS Error:", error);
    showVisualAlert(text);
  }
}

// Visual alert fallback for speech synthesis failures
function showVisualAlert(message) {
  const alertDiv = document.createElement('div');
  alertDiv.className = 'visual-alert';
  alertDiv.innerHTML = `
    <div class="alert-content">
      <span class="alert-icon">🔊</span>
      <span class="alert-text">${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="alert-close">✕</button>
    </div>
  `;
  
  // Add styles if not already present
  if (!document.querySelector('#visual-alert-styles')) {
    const styles = document.createElement('style');
    styles.id = 'visual-alert-styles';
    styles.textContent = `
      .visual-alert {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #fff3cd;
        border: 3px solid #ffc107;
        border-radius: 12px;
        padding: 16px;
        z-index: 1000;
        max-width: 90vw;
        font-size: 18px;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      }
      .alert-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .alert-icon {
        font-size: 24px;
      }
      .alert-close {
        background: #ffc107;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        margin-left: auto;
      }
    `;
    document.head.appendChild(styles);
  }
  
  document.body.appendChild(alertDiv);
  
  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (alertDiv.parentElement) {
      alertDiv.remove();
    }
  }, 10000);
}

// Enhanced confirmation with multiple modalities
function elderlyConfirm(message, actionType = 'action') {
  return new Promise((resolve) => {
    // Speak the confirmation request
    ttsSpeak(`Please confirm: ${message}`, 'urgent');
    
    // Create enhanced confirmation dialog
    const dialog = document.createElement('div');
    dialog.className = 'elderly-confirm-dialog';
    dialog.innerHTML = `
      <div class="confirm-overlay"></div>
      <div class="confirm-content">
        <div class="confirm-icon">${actionType === 'payment' ? '💳' : '⚠️'}</div>
        <h2>Please Confirm</h2>
        <p class="confirm-message">${message}</p>
        <div class="confirm-actions">
          <button class="btn btn-lg confirm-yes" data-result="true">
            ✅ Yes, Continue
          </button>
          <button class="btn btn-lg btn-secondary confirm-no" data-result="false">
            ❌ No, Cancel
          </button>
        </div>
        <p class="confirm-help">
          💡 Take your time to read and confirm. Click "No" if you're unsure.
        </p>
      </div>
    `;
    
    // Add styles
    if (!document.querySelector('#elderly-confirm-styles')) {
      const styles = document.createElement('style');
      styles.id = 'elderly-confirm-styles';
      styles.textContent = `
        .elderly-confirm-dialog {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .confirm-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.7);
        }
        .confirm-content {
          background: white;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 90vw;
          text-align: center;
          position: relative;
          box-shadow: 0 16px 48px rgba(0,0,0,0.3);
          border: 3px solid #c41230;
        }
        .confirm-icon {
          font-size: 64px;
          margin-bottom: 16px;
        }
        .confirm-content h2 {
          color: #c41230;
          margin-bottom: 16px;
          font-size: 24px;
        }
        .confirm-message {
          font-size: 20px;
          line-height: 1.6;
          margin-bottom: 24px;
          color: #333;
        }
        .confirm-actions {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
          flex-direction: column;
        }
        .confirm-help {
          font-size: 16px;
          color: #666;
          font-style: italic;
        }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(dialog);
    
    // Handle button clicks
    dialog.addEventListener('click', (e) => {
      if (e.target.matches('[data-result]')) {
        const result = e.target.getAttribute('data-result') === 'true';
        document.body.removeChild(dialog);
        resolve(result);
      }
    });
    
    // Focus management for accessibility
    const yesButton = dialog.querySelector('.confirm-yes');
    yesButton.focus();
  });
}

// -------- Enhanced Safe Mode for Elderly Users --------
const safeToggle = $("#safemode");
const recipientInput = $("#recipient");
const recipientSelect = $("#recipient-select");
const billerSelect = $("#biller");

function populateRecipientsSafeMode(enabled) {
  if (!recipientInput || !recipientSelect) return;
  
  if (enabled) {
    // Create select element if it doesn't exist
    if (!recipientSelect) {
      const select = document.createElement('select');
      select.id = 'recipient-select';
      select.name = 'recipient-select';
      select.className = recipientInput.className;
      recipientInput.parentNode.insertBefore(select, recipientInput.nextSibling);
    }
    
    recipientSelect.innerHTML = '<option value="">👥 Choose a trusted contact...</option>';
    approvedRecipients.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.value;
      opt.textContent = r.label;
      recipientSelect.appendChild(opt);
    });
    
    recipientInput.style.display = 'none';
    recipientSelect.style.display = 'block';
    
    // Announce the change
    ttsSpeak("Safe mode enabled. You can now only send money to your trusted contacts.", 'normal');
  } else {
    if (recipientSelect) recipientSelect.style.display = 'none';
    recipientInput.style.display = 'block';
    
    ttsSpeak("Safe mode disabled. You can now send money to anyone. Please be careful of scams.", 'urgent');
  }
}

function populateBillersSafeMode(enabled) {
  if (!billerSelect) return;
  
  billerSelect.innerHTML = "";
  const list = enabled ? approvedBillers : allBillers;
  billerSelect.appendChild(new Option("🏢 Choose a biller...", ""));
  
  list.forEach((b) => billerSelect.appendChild(new Option(b, b)));
  
  if (enabled) {
    ttsSpeak("Safe mode: Only showing your regular bills", 'normal');
  }
}

// Enhanced Safe Mode Toggle with clear audio feedback
if (safeToggle) {
  safeToggle.addEventListener("change", () => {
    const enabled = safeToggle.checked;
    populateRecipientsSafeMode(enabled);
    populateBillersSafeMode(enabled);
    
    // Visual feedback
    const toggleContainer = safeToggle.closest('.safe');
    if (enabled) {
      toggleContainer.style.borderColor = '#28a745';
      toggleContainer.style.backgroundColor = '#f8fff9';
    } else {
      toggleContainer.style.borderColor = '#c41230';
      toggleContainer.style.backgroundColor = 'white';
    }
  });
  
  // Initial population
  populateRecipientsSafeMode(safeToggle.checked);
  populateBillersSafeMode(safeToggle.checked);
}

// -------- Enhanced Quick Amount Chips for Elderly --------
document.querySelectorAll(".chip").forEach((chip, index) => {
  // Add common amounts for elderly users
  const elderlyAmounts = ['10', '20', '50', '100', '200', '500'];
  
  if (index < elderlyAmounts.length) {
    chip.setAttribute('data-amt', elderlyAmounts[index]);
    chip.textContent = `$${elderlyAmounts[index]}`;
    
    chip.addEventListener("click", () => {
      const amt = chip.getAttribute("data-amt");
      const amountField = $("#amount") || $("#bill-amount");
      
      if (amountField) {
        amountField.value = amt;
        amountField.focus();
        
        // Audio feedback
        ttsSpeak(`Amount selected: ${amt} dollars`, 'normal');
        
        // Visual feedback
        chip.style.transform = 'scale(1.1)';
        setTimeout(() => {
          chip.style.transform = 'scale(1)';
        }, 200);
      }
    });
  }
});

// -------- Enhanced Validation for Elderly Users --------
function validateElderlyInput(value, type) {
  switch(type) {
    case 'mobile':
      const isValid = /^[89]\d{7}$/.test(value);
      if (!isValid) {
        ttsSpeak("Please enter a valid Singapore mobile number starting with 8 or 9", 'urgent');
      }
      return isValid;
      
    case 'nric':
      const nricValid = /^[STFG]\d{7}[A-Z]$/i.test(value);
      if (!nricValid) {
        ttsSpeak("Please enter a valid NRIC or FIN number", 'urgent');
      }
      return nricValid;
      
    case 'amount':
      const amount = parseFloat(value);
      if (isNaN(amount) || amount <= 0) {
        ttsSpeak("Please enter a valid amount greater than zero", 'urgent');
        return false;
      }
      if (amount > 5000) {
        ttsSpeak("Large amount detected. Please double-check this is correct.", 'urgent');
      }
      return true;
      
    default:
      return true;
  }
}

// -------- Enhanced PayNow Flow for Elderly --------
const paynowForm = document.querySelector("form");
if (paynowForm) {
  paynowForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const method = $("#method")?.value || "";
    const recipient = $("#recipient")?.value || $("#recipient-select")?.value || "";
    const amount = $("#amount")?.value || "";
    const purpose = $("#purpose")?.value || "";

    // Enhanced validation with audio feedback
    if (!recipient) {
      ttsSpeak("Please choose who you want to send money to", 'urgent');
      return;
    }
    
    if (!validateElderlyInput(amount, 'amount')) {
      return;
    }
    
    // Scam detection with elderly-specific warnings
    const scamRisk = detectElderlyScamRisk(recipient, amount, purpose);
    if (scamRisk.high) {
      const confirmed = await elderlyConfirm(
        `⚠️ WARNING: This transaction looks suspicious. ${scamRisk.reason} Are you sure you want to continue?`,
        'payment'
      );
      if (!confirmed) {
        ttsSpeak("Transaction cancelled for your safety", 'normal');
        return;
      }
    }
    
    // Final confirmation with clear details
    const confirmMessage = `
      You are about to send ${formatCurrency(amount)} to ${recipient}. 
      ${purpose ? `For: ${purpose}. ` : ''}
      Is this correct?
    `;
    
    const finalConfirmed = await elderlyConfirm(confirmMessage, 'payment');
    if (!finalConfirmed) {
      ttsSpeak("Transaction cancelled", 'normal');
      return;
    }

    // Store data and proceed
    localStorage.setItem("paynow_method", method);
    localStorage.setItem("paynow_recipient", recipient);
    localStorage.setItem("paynow_amount", amount);
    localStorage.setItem("paynow_purpose", purpose);

    ttsSpeak("Proceeding to confirmation page", 'normal');
    window.location.href = "confirm-paynow.html";
  });
}

// -------- Elderly-Specific Scam Detection --------
function detectElderlyScamRisk(recipient, amount, purpose) {
  let riskScore = 0;
  let reasons = [];
  
  // Large amount risk
  if (parseFloat(amount) >= 1000) {
    riskScore += 3;
    reasons.push("This is a large amount");
  }
  
  // Unknown recipient (not in approved list)
  const isApproved = approvedRecipients.some(r => r.value === recipient);
  if (!isApproved) {
    riskScore += 2;
    reasons.push("This person is not in your trusted contacts");
  }
  
  // Scam keywords in purpose
  const scamKeywords = ['secure', 'refund', 'loan', 'urgent', 'police', 'bank officer', 'verify account', 'suspended', 'frozen'];
  const purposeLower = purpose.toLowerCase();
  const hasScamKeyword = scamKeywords.some(keyword => purposeLower.includes(keyword));
  
  if (hasScamKeyword) {
    riskScore += 4;
    reasons.push("The purpose contains words commonly used in scams");
  }
  
  // Time-based risk (late night transactions)
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 6) {
    riskScore += 1;
    reasons.push("Unusual transaction time");
  }
  
  return {
    high: riskScore >= 3,
    medium: riskScore >= 2,
    score: riskScore,
    reason: reasons.join(', ')
  };
}

// -------- Display PayNow Details on Confirmation Page --------
window.addEventListener("DOMContentLoaded", function () {
  const methodEl = $("#confirm-method");
  const recipientEl = $("#confirm-recipient");
  const amountEl = $("#confirm-amount");
  const purposeEl = $("#confirm-purpose");

  if (methodEl && recipientEl && amountEl && purposeEl) {
    const method = localStorage.getItem("paynow_method");
    const recipient = localStorage.getItem("paynow_recipient");
    const amount = localStorage.getItem("paynow_amount");
    const purpose = localStorage.getItem("paynow_purpose");

    if (method || recipient || amount || purpose) {
      methodEl.textContent = method || "(none)";
      recipientEl.textContent = recipient || "(none)";
      amountEl.textContent = formatCurrency(amount);
      purposeEl.textContent = purpose || "—";
      
      // Announce the details
      const details = `Confirming payment of ${formatCurrency(amount)} to ${recipient}`;
      ttsSpeak(details, 'normal');
    }
  }
  
  // Add elderly-friendly page load announcement
  const pageTitle = document.title;
  if (pageTitle.includes('PayNow')) {
    ttsSpeak("PayNow page loaded. Please fill in the details carefully", 'normal');
  } else if (pageTitle.includes('Confirm')) {
    ttsSpeak("Confirmation page. Please review your transaction details", 'normal');
  }
});

// -------- Enhanced Keyboard Navigation for Elderly --------
document.addEventListener('keydown', function(e) {
  // Large button focus indicators
  if (e.key === 'Tab') {
    // Enhance focus visibility for elderly users
    setTimeout(() => {
      const focused = document.activeElement;
      if (focused && focused.classList.contains('btn')) {
        focused.style.transform = 'scale(1.05)';
        focused.style.boxShadow = '0 0 0 4px rgba(196,18,48,0.5)';
      }
    }, 10);
  }
  
  // Voice shortcuts
  if (e.altKey) {
    switch(e.key) {
      case 's': // Alt+S for Safe Mode toggle
        if (safeToggle) {
          safeToggle.checked = !safeToggle.checked;
          safeToggle.dispatchEvent(new Event('change'));
        }
        break;
      case 'h': // Alt+H for help
        ttsSpeak("Press Alt+S to toggle safe mode. Press Tab to move between buttons. Press Enter to select.", 'normal');
        break;
    }
  }
});

// Remove enhanced focus when element loses focus
document.addEventListener('focusout', function(e) {
  if (e.target && e.target.classList.contains('btn')) {
    e.target.style.transform = '';
    e.target.style.boxShadow = '';
  }
});

// -------- Enhanced Success and Error Handling --------
function showElderlySuccess(message, nextAction = null) {
  ttsSpeak(`Success! ${message}`, 'normal');
  
  const successDiv = document.createElement('div');
  successDiv.className = 'elderly-success';
  successDiv.innerHTML = `
    <div class="success-content">
      <div class="success-icon">✅</div>
      <h2>Success!</h2>
      <p>${message}</p>
      ${nextAction ? `<button class="btn btn-lg" onclick="${nextAction}">Continue</button>` : ''}
    </div>
  `;
  
  document.body.appendChild(successDiv);
  
  // Auto-remove after 8 seconds if no next action
  if (!nextAction) {
    setTimeout(() => {
      if (successDiv.parentElement) {
        successDiv.remove();
      }
    }, 8000);
  }
}

function showElderlyError(message, suggestion = null) {
  ttsSpeak(`Error: ${message}. ${suggestion || 'Please try again.'}`, 'urgent');
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'elderly-error';
  errorDiv.innerHTML = `
    <div class="error-content">
      <div class="error-icon">❌</div>
      <h2>Something went wrong</h2>
      <p>${message}</p>
      ${suggestion ? `<p class="error-suggestion">💡 ${suggestion}</p>` : ''}
      <button class="btn btn-lg" onclick="this.closest('.elderly-error').remove()">OK, I understand</button>
    </div>
  `;
  
  document.body.appendChild(errorDiv);
}

// -------- Page Load Optimization for Elderly --------
document.addEventListener('DOMContentLoaded', function() {
  // Add elderly-specific CSS if not already present
  if (!document.querySelector('#elderly-enhancements')) {
    const elderlyStyles = document.createElement('style');
    elderlyStyles.id = 'elderly-enhancements';
    elderlyStyles.textContent = `
      .elderly-success, .elderly-error {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 16px;
        padding: 32px;
        text-align: center;
        z-index: 2000;
        box-shadow: 0 16px 48px rgba(0,0,0,0.3);
        border: 3px solid;
        max-width: 500px;
        width: 90vw;
      }
      .elderly-success {
        border-color: #28a745;
      }
      .elderly-error {
        border-color: #dc3545;
      }
      .success-icon, .error-icon {
        font-size: 64px;
        margin-bottom: 16px;
      }
      .success-content h2, .error-content h2 {
        margin-bottom: 16px;
        font-size: 24px;
      }
      .success-content p, .error-content p {
        font-size: 20px;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      .error-suggestion {
        background: #fff3cd;
        border: 2px solid #ffc107;
        padding: 12px;
        border-radius: 8px;
        font-weight: 600;
      }
      
      /* Enhanced focus indicators */
      *:focus {
        outline: 3px solid #c41230 !important;
        outline-offset: 2px !important;
      }
      
      /* Larger touch targets on mobile */
      @media (max-width: 768px) {
        .btn {
          min-height: 56px;
          font-size: 20px;
        }
        
        input, select, textarea {
          min-height: 56px;
          font-size: 20px;
        }
      }
    `;
    document.head.appendChild(elderlyStyles);
  }
  
  // Welcome announcement
  setTimeout(() => {
    ttsSpeak("Welcome to EasyATM. This system is designed for easy and safe banking. Use the tab key to navigate between options.", 'normal');
  }, 1000);
});

console.log("🎯 EasyATM Elderly-Optimized System Loaded Successfully!");