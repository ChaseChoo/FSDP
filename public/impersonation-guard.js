// ============================================================================
// IMPERSONATION GUARD - Voice-Based Social Engineering Detection System
// ============================================================================
// This module monitors ambient audio for social engineering keywords and
// locks transactions when suspicious phrases are detected.

if (window.__impersonation_guard_loaded) {
  console.warn('[ImpersonationGuard] Already loaded; skipping second initialization');
} else {
  window.__impersonation_guard_loaded = true;

  // ============================================================================
  // Configuration
  // ============================================================================
  
  const SOCIAL_ENGINEERING_KEYWORDS = [
    // Urgency and pressure phrases
    "don't tell anyone",
    "don't tell anybody",
    "keep it secret",
    "do this immediately",
    "do it now",
    "right now",
    "hurry up",
    "urgent",
    "emergency",
    
    // Impersonation phrases
    "this is your bank",
    "this is the bank",
    "i'm from the bank",
    "i'm calling from",
    "this is the police",
    "this is government",
    "tax department",
    "revenue authority",
    "iras officer",
    "police officer",
    
    // Account threat phrases
    "your account will be locked",
    "account will be frozen",
    "account suspended",
    "block your account",
    "close your account",
    "suspend your card",
    
    // Verification/credential requests
    "verify your account",
    "confirm your pin",
    "give me your pin",
    "what's your pin",
    "tell me your password",
    "security code",
    "secret code",
    "verification code",
    "otp number",
    
    // Payment/transfer demands
    "transfer the money",
    "send the payment",
    "make a payment",
    "pay the fine",
    "settle the amount",
    "clear the debt",
    
    // Fear and intimidation
    "legal action",
    "arrest warrant",
    "you will be arrested",
    "facing charges",
    "criminal investigation",
    "fraud case",
    
    // Common scam scenarios
    "tax refund",
    "you won",
    "lottery prize",
    "inheritance",
    "investment opportunity",
    "guaranteed returns",
    "easy money"
  ];

  // ============================================================================
  // State Management
  // ============================================================================
  
  let recognition = null;
  let isMonitoring = false;
  let isTransactionLocked = false;
  let detectedPhrases = [];
  let microphoneEnabled = false;

  // ============================================================================
  // Speech Recognition Setup
  // ============================================================================
  
  function initializeSpeechRecognition() {
    try {
      // Check browser support
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.warn('[ImpersonationGuard] Speech recognition not supported in this browser');
        return false;
      }

      recognition = new SpeechRecognition();
      recognition.continuous = true; // Keep listening
      recognition.interimResults = true; // Get partial results
      recognition.lang = 'en-SG'; // Singapore English
      recognition.maxAlternatives = 3;

      // Handle recognition results
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript.toLowerCase().trim();
        
        console.log('[ImpersonationGuard] Detected speech:', transcript);
        
        // Check for social engineering keywords
        checkForSuspiciousKeywords(transcript);
      };

      // Handle errors
      recognition.onerror = (event) => {
        console.error('[ImpersonationGuard] Recognition error:', event.error);
        
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          updateMicrophoneStatus('permission-denied');
          microphoneEnabled = false;
        } else if (event.error === 'no-speech') {
          // Restart if no speech detected (timeout)
          if (isMonitoring) {
            setTimeout(() => {
              try { recognition.start(); } catch (e) {}
            }, 1000);
          }
        }
      };

      // Handle recognition end
      recognition.onend = () => {
        console.log('[ImpersonationGuard] Recognition ended');
        
        // Restart if still monitoring
        if (isMonitoring && microphoneEnabled) {
          setTimeout(() => {
            try {
              recognition.start();
              console.log('[ImpersonationGuard] Recognition restarted');
            } catch (e) {
              console.warn('[ImpersonationGuard] Could not restart recognition:', e.message);
            }
          }, 500);
        }
      };

      recognition.onstart = () => {
        console.log('[ImpersonationGuard] Recognition started successfully');
        updateMicrophoneStatus('active');
      };

      return true;
    } catch (err) {
      console.error('[ImpersonationGuard] Failed to initialize speech recognition:', err);
      return false;
    }
  }

  // ============================================================================
  // Keyword Detection
  // ============================================================================
  
  function checkForSuspiciousKeywords(transcript) {
    const detectedKeywords = [];
    
    // Check each keyword
    for (const keyword of SOCIAL_ENGINEERING_KEYWORDS) {
      if (transcript.includes(keyword)) {
        detectedKeywords.push(keyword);
        console.warn('[ImpersonationGuard] ⚠️ SUSPICIOUS PHRASE DETECTED:', keyword);
      }
    }
    
    // If suspicious keywords found, trigger alert
    if (detectedKeywords.length > 0) {
      handleSuspiciousActivity(detectedKeywords, transcript);
    }
  }

  // ============================================================================
  // Alert and Transaction Lock
  // ============================================================================
  
  function handleSuspiciousActivity(keywords, fullTranscript) {
    // Add to detected phrases log
    detectedPhrases.push({
      timestamp: new Date().toISOString(),
      keywords: keywords,
      transcript: fullTranscript
    });
    
    // Lock transaction immediately
    if (!isTransactionLocked) {
      isTransactionLocked = true;
      lockTransaction(keywords);
    }
  }

  function lockTransaction(detectedKeywords) {
    console.error('[ImpersonationGuard] 🚨 TRANSACTION LOCKED - Social engineering detected');
    
    // Stop speech recognition temporarily
    if (recognition && isMonitoring) {
      try {
        recognition.stop();
        isMonitoring = false;
      } catch (e) {}
    }
    
    // Play alert sound if available
    playAlertSound();
    
    // Show warning modal with PIN verification
    showPinVerificationModal(detectedKeywords);
    
    // Dispatch event for other modules
    window.dispatchEvent(new CustomEvent('transactionLocked', {
      detail: { reason: 'social-engineering', keywords: detectedKeywords }
    }));
  }

  // ============================================================================
  // PIN Verification Modal
  // ============================================================================
  
  function showPinVerificationModal(detectedKeywords) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.id = 'impersonation-guard-modal';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    modalContent.innerHTML = `
      <div class="modal-icon">🚨</div>
      <h1 class="modal-title">Security Alert</h1>
      <div class="detected-phrases-box">
        <p class="detected-phrases-title">Suspicious phrases detected:</p>
        <div class="phrases-list">
          ${detectedKeywords.map(k => `
            <div class="phrase-item">
              <span class="phrase-icon">🔴</span>
              <span>"${k}"</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="security-reminders-box">
        <p class="security-reminders-text">
          <strong class="security-reminders-title">⚠️ Security Reminders:</strong>
          <span class="reminder-item">✗ Banks NEVER ask for transfers via phone</span>
          <span class="reminder-item">✗ Police DON'T collect fines through ATMs</span>
          <span class="reminder-item">✗ Government NEVER demands immediate payment</span>
          <span class="reminder-item">✗ HANG UP if feeling pressured or threatened</span>
        </p>
      </div>
      <p class="pin-instruction">Enter your 4-digit login PIN to continue:</p>
      <div class="pin-input-container">
        <input 
          type="password" 
          id="pin-verification-input"
          maxlength="4"
          pattern="[0-9]{4}"
          placeholder="••••"
          autocomplete="off"
        />
        <div id="pin-error">❌ Incorrect PIN. Please try again.</div>
      </div>
      <div class="modal-buttons">
        <button id="verify-pin-btn">✓ Verify PIN</button>
        <button id="cancel-transaction-btn">✗ Cancel</button>
      </div>
      <p class="modal-footer">
        Need help? Call <strong style="color: #333;">1800-BANK-HELP</strong>
      </p>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Focus PIN input
    setTimeout(() => {
      document.getElementById('pin-verification-input').focus();
    }, 300);
    
    // Attach event listeners
    document.getElementById('verify-pin-btn').onclick = verifyPinAndProceed;
    document.getElementById('cancel-transaction-btn').onclick = cancelTransaction;
    document.getElementById('pin-verification-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        verifyPinAndProceed();
      }
    });
  }

  async function verifyPinAndProceed() {
    const pinInput = document.getElementById('pin-verification-input');
    const pin = pinInput.value;
    const pinError = document.getElementById('pin-error');
    
    console.log('[ImpersonationGuard] PIN input value:', pin);
    console.log('[ImpersonationGuard] PIN length:', pin?.length);
    
    // Basic validation
    if (!/^\d{4}$/.test(pin)) {
      console.log('[ImpersonationGuard] PIN validation failed - not 4 digits');
      pinError.textContent = 'PIN must be exactly 4 digits';
      pinError.style.display = 'block';
      pinInput.value = '';
      pinInput.focus();
      return;
    }
    
    console.log('[ImpersonationGuard] PIN validation passed, proceeding with API call');
    
    // Show loading state
    const verifyBtn = document.getElementById('verify-pin-btn');
    verifyBtn.textContent = 'Verifying...';
    verifyBtn.disabled = true;
    
    try {
      // Call backend to verify PIN
      const token = localStorage.getItem('token');
      console.log('[ImpersonationGuard] Token present:', !!token);
      console.log('[ImpersonationGuard] Token preview:', token ? token.substring(0, 20) + '...' : 'null');
      
      if (!token) {
        console.error('[ImpersonationGuard] No token found in localStorage!');
        pinError.textContent = 'Session expired. Please login again.';
        pinError.style.display = 'block';
        verifyBtn.textContent = 'Verify PIN & Continue';
        verifyBtn.disabled = false;
        return;
      }
      
      console.log('[ImpersonationGuard] Sending request to /api/card/verify-pin');
      
      const response = await fetch('/api/card/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pin })
      });
      
      console.log('[ImpersonationGuard] Response status:', response.status);
      console.log('[ImpersonationGuard] Response ok:', response.ok);
      
      // Get response text first to see what we're getting
      const responseText = await response.text();
      console.log('[ImpersonationGuard] Response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('[ImpersonationGuard] Response data:', result);
      } catch (e) {
        console.error('[ImpersonationGuard] Failed to parse response as JSON:', e);
        console.error('[ImpersonationGuard] Raw response:', responseText);
        pinError.textContent = 'Server error. Please try again.';
        pinError.style.display = 'block';
        verifyBtn.textContent = 'Verify PIN & Continue';
        verifyBtn.disabled = false;
        return;
      }
      
      if (response.ok && result.valid) {
        // PIN correct - unlock transaction
        unlockTransaction();
        closeModal();
      } else {
        // PIN incorrect
        const errorMsg = result.error || 'Incorrect PIN. Please try again.';
        console.log('[ImpersonationGuard] Error message:', errorMsg);
        pinError.textContent = errorMsg;
        pinError.style.display = 'block';
        pinInput.value = '';
        pinInput.focus();
        verifyBtn.textContent = 'Verify PIN & Continue';
        verifyBtn.disabled = false;
      }
    } catch (err) {
      console.error('[ImpersonationGuard] PIN verification error:', err);
      pinError.textContent = 'Verification failed. Please try again.';
      pinError.style.display = 'block';
      verifyBtn.textContent = 'Verify PIN & Continue';
      verifyBtn.disabled = false;
    }
  }

  function unlockTransaction() {
    isTransactionLocked = false;
    detectedPhrases = [];
    console.log('[ImpersonationGuard] ✅ Transaction unlocked via PIN verification');
    
    // Restart monitoring
    if (microphoneEnabled) {
      startMonitoring();
    }
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('transactionUnlocked', {
      detail: { method: 'pin-verification' }
    }));
  }

  function cancelTransaction() {
    closeModal();
    
    // Redirect back to home or transaction page
    alert('Transaction cancelled for your safety. If you believe this is a scam, please report it to your bank immediately.');
    
    // Clear form data
    localStorage.removeItem('paynow_method');
    localStorage.removeItem('paynow_recipient');
    localStorage.removeItem('paynow_amount');
    localStorage.removeItem('paynow_purpose');
    
    // Redirect
    window.location.href = 'paynow.html';
  }

  function closeModal() {
    const modal = document.getElementById('impersonation-guard-modal');
    if (modal) {
      modal.style.animation = 'fadeOut 0.3s';
      setTimeout(() => modal.remove(), 300);
    }
  }

  // ============================================================================
  // Microphone Status UI
  // ============================================================================
  
  function updateMicrophoneStatus(status) {
    const indicator = document.getElementById('mic-status-indicator');
    if (!indicator) return;
    
    const statusConfig = {
      'inactive': { 
        text: '🎤 Monitoring Inactive', 
        className: 'status-inactive'
      },
      'requesting': { 
        text: '🎤 Requesting Permission...', 
        className: 'status-inactive'
      },
      'active': { 
        text: '🎤 Active - Listening', 
        className: 'status-active'
      },
      'permission-denied': { 
        text: '🎤 Permission Denied', 
        className: 'status-locked'
      },
      'locked': { 
        text: '🚨 TRANSACTION LOCKED', 
        className: 'status-locked'
      }
    };
    
    const config = statusConfig[status] || statusConfig['inactive'];
    
    // Remove all status classes
    indicator.className = 'status-badge';
    // Add the appropriate class
    indicator.classList.add(config.className);
    indicator.textContent = config.text;
  }

  // ============================================================================
  // Alert Sound
  // ============================================================================
  
  function playAlertSound() {
    try {
      // Create audio context for alert beep
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // 800 Hz alert tone
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      // Second beep
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 800;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.3);
      }, 400);
    } catch (err) {
      console.warn('[ImpersonationGuard] Could not play alert sound:', err);
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================
  
  async function startMonitoring() {
    if (isMonitoring) {
      console.log('[ImpersonationGuard] Already monitoring');
      return;
    }
    
    updateMicrophoneStatus('requesting');
    
    // Initialize if not already done
    if (!recognition) {
      const initialized = initializeSpeechRecognition();
      if (!initialized) {
        alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        updateMicrophoneStatus('inactive');
        return;
      }
    }
    
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      microphoneEnabled = true;
      
      // Start recognition
      recognition.start();
      isMonitoring = true;
      
      console.log('[ImpersonationGuard] ✅ Monitoring started');
      updateMicrophoneStatus('active');
      
      // Stop the stream (we only needed it for permission)
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      console.error('[ImpersonationGuard] Failed to start monitoring:', err);
      microphoneEnabled = false;
      updateMicrophoneStatus('permission-denied');
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        alert('Microphone permission denied. Impersonation Guard requires microphone access to protect you from scams. Please enable microphone access in your browser settings.');
      }
    }
  }

  function stopMonitoring() {
    if (!isMonitoring) return;
    
    try {
      if (recognition) {
        recognition.stop();
      }
      isMonitoring = false;
      console.log('[ImpersonationGuard] Monitoring stopped');
      updateMicrophoneStatus('inactive');
    } catch (err) {
      console.error('[ImpersonationGuard] Error stopping monitoring:', err);
    }
  }

  function getStatus() {
    return {
      isMonitoring,
      isTransactionLocked,
      microphoneEnabled,
      detectedPhrases: detectedPhrases.slice() // Return copy
    };
  }

  // ============================================================================
  // Export Public API
  // ============================================================================
  
  window.ImpersonationGuard = {
    startMonitoring,
    stopMonitoring,
    getStatus,
    isLocked: () => isTransactionLocked
  };

  console.log('[ImpersonationGuard] Module loaded successfully');
}
