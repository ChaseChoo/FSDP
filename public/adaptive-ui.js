/**
 * Adaptive ATM UI Module
 * 
 * Provides intelligent UI adaptation for elderly and disabled users.
 * Detects user hesitation and offers guided mode when needed.
 * 
 * Hesitation Detection Metrics:
 * - Time spent on current screen > 30 seconds
 * - Repeated back button presses >= 3 times
 * - Inactivity (no user interaction) > 20 seconds
 */

class AdaptiveATMUI {
  constructor() {
    this.isGuidedMode = false;
    this.screenEntryTime = Date.now();
    this.inactivityTimeout = null;
    this.screenTimeoutCheck = null;
    this.backButtonPressCount = 0;
    this.lastInteractionTime = Date.now();
    
    // Configuration
    this.SCREEN_TIME_THRESHOLD = 30000; // 30 seconds
    this.INACTIVITY_THRESHOLD = 20000; // 20 seconds
    this.BACK_PRESS_THRESHOLD = 3; // 3 presses
    this.RESET_BACK_PRESS_TIME = 5000; // Reset counter after 5 seconds of inactivity
    
    this.init();
  }

  /**
   * Initialize the adaptive UI system
   */
  init() {
    this.createHelpOverlay();
    this.attachEventListeners();
    this.startHesitationDetection();
    console.log('Adaptive UI initialized');
  }

  /**
   * Create the help overlay UI
   */
  createHelpOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'adaptive-help-overlay';
    overlay.className = 'adaptive-help-overlay hidden';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-labelledby', 'adaptive-help-title');
    overlay.setAttribute('aria-hidden', 'true');
    
    overlay.innerHTML = `
      <div class="adaptive-help-card">
        <div class="adaptive-help-header">
          <svg class="adaptive-help-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 16v-4"></path>
            <path d="M12 8h.01"></path>
          </svg>
          <h2 id="adaptive-help-title" class="adaptive-help-title">Need help?</h2>
        </div>
        
        <p class="adaptive-help-message">
          Let me guide you through this step by step with larger text and simpler options.
        </p>
        
        <div class="adaptive-help-buttons">
          <button id="adaptive-yes-btn" class="adaptive-btn adaptive-btn-primary">
            <span>Yes, guide me</span>
          </button>
          <button id="adaptive-no-btn" class="adaptive-btn adaptive-btn-secondary">
            <span>No, continue</span>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Bind button events
    document.getElementById('adaptive-yes-btn').addEventListener('click', () => this.enableGuidedMode());
    document.getElementById('adaptive-no-btn').addEventListener('click', () => this.dismissHelp());
  }

  /**
   * Attach global event listeners for hesitation detection
   */
  attachEventListeners() {
    // Track user interaction (keyboard, mouse, touch)
    document.addEventListener('keydown', () => this.resetInactivityTimer(), true);
    document.addEventListener('mousemove', () => this.resetInactivityTimer(), true);
    document.addEventListener('mousedown', () => this.resetInactivityTimer(), true);
    document.addEventListener('touchstart', () => this.resetInactivityTimer(), true);
    
    // Track back button presses
    const backButtons = document.querySelectorAll('[data-action="back"]');
    backButtons.forEach(btn => {
      btn.addEventListener('click', () => this.trackBackButtonPress());
    });
  }

  /**
   * Start detecting hesitation patterns
   */
  startHesitationDetection() {
    // Check screen time periodically
    this.screenTimeoutCheck = setInterval(() => {
      const timeOnScreen = Date.now() - this.screenEntryTime;
      
      // If user is still on the same screen and hasn't interacted much
      if (
        timeOnScreen > this.SCREEN_TIME_THRESHOLD &&
        !this.isHelpShown() &&
        !this.isGuidedMode
      ) {
        console.log('Hesitation detected: User spent', timeOnScreen / 1000, 'seconds on screen');
        this.showHelpOverlay();
      }
    }, 5000); // Check every 5 seconds
    
    // Start inactivity timer
    this.resetInactivityTimer();
  }

  /**
   * Reset and restart the inactivity timer
   * Detects when user goes idle for 20+ seconds
   */
  resetInactivityTimer() {
    this.lastInteractionTime = Date.now();
    
    // Clear existing timeout
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    
    // Set new inactivity timeout
    this.inactivityTimeout = setTimeout(() => {
      const inactiveTime = Date.now() - this.lastInteractionTime;
      
      if (
        inactiveTime >= this.INACTIVITY_THRESHOLD &&
        !this.isHelpShown() &&
        !this.isGuidedMode
      ) {
        console.log('Hesitation detected: Inactivity for', inactiveTime / 1000, 'seconds');
        this.showHelpOverlay();
      }
    }, this.INACTIVITY_THRESHOLD);
  }

  /**
   * Track back button presses
   * If user presses back 3+ times, they're likely confused
   */
  trackBackButtonPress() {
    this.backButtonPressCount++;
    console.log('Back button pressed:', this.backButtonPressCount, 'times');
    
    if (
      this.backButtonPressCount >= this.BACK_PRESS_THRESHOLD &&
      !this.isHelpShown() &&
      !this.isGuidedMode
    ) {
      console.log('Hesitation detected: Multiple back button presses');
      this.showHelpOverlay();
      this.backButtonPressCount = 0; // Reset counter
    }
    
    // Auto-reset counter if no more back presses within 5 seconds
    setTimeout(() => {
      if (this.backButtonPressCount > 0) {
        this.backButtonPressCount = 0;
      }
    }, this.RESET_BACK_PRESS_TIME);
  }

  /**
   * Show the help overlay
   */
  showHelpOverlay() {
    const overlay = document.getElementById('adaptive-help-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.setAttribute('aria-hidden', 'false');
      
      // Announce to screen readers
      this.announceToScreenReader('Need help? Let me guide you through this step by step.');
    }
  }

  /**
   * Check if help overlay is currently shown
   */
  isHelpShown() {
    const overlay = document.getElementById('adaptive-help-overlay');
    return overlay && !overlay.classList.contains('hidden');
  }

  /**
   * Enable guided mode
   * Simplifies UI and provides step-by-step guidance
   */
  enableGuidedMode() {
    this.isGuidedMode = true;
    const overlay = document.getElementById('adaptive-help-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }
    
    // Apply guided mode styles to body
    document.body.classList.add('adaptive-guided-mode');
    
    // Announce mode activation
    this.announceToScreenReader('Guided mode enabled. I will show you one step at a time.');
    this.speakGuidancePrompt('Guided mode enabled. I will show you one step at a time.');
    
    // Simplify the UI
    this.simplifyUI();
    
    console.log('Guided mode enabled');
  }

  /**
   * Disable guided mode
   */
  disableGuidedMode() {
    this.isGuidedMode = false;
    document.body.classList.remove('adaptive-guided-mode');
    console.log('Guided mode disabled');
  }

  /**
   * Simplify UI for guided mode:
   * - Reduce visible buttons to core actions only
   * - Increase font sizes
   * - Show one step at a time
   */
  simplifyUI() {
    // Hide non-essential UI elements
    const elementsToHide = document.querySelectorAll('[data-guided-hide]');
    elementsToHide.forEach(el => {
      el.style.display = 'none';
    });
    
    // Keep main page buttons clickable
    // Only disable buttons that are explicitly marked to hide
    const buttonsToDisable = document.querySelectorAll('[data-guided-disable]');
    buttonsToDisable.forEach(btn => {
      btn.style.opacity = '0.5';
      btn.style.pointerEvents = 'none';
    });
  }

  /**
   * Dismiss the help overlay without enabling guided mode
   */
  dismissHelp() {
    const overlay = document.getElementById('adaptive-help-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.setAttribute('aria-hidden', 'true');
    }
    
    // Reset timers
    this.screenEntryTime = Date.now();
    this.backButtonPressCount = 0;
    console.log('Help overlay dismissed');
  }

  /**
   * Announce message to screen readers (accessibility)
   */
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 3000);
  }

  /**
   * Speak guidance prompt using Web Speech API
   */
  speakGuidancePrompt(text) {
    if ('speechSynthesis' in window) {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Slower speech for clarity
      utterance.pitch = 1;
      utterance.volume = 1;
      
      try {
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.warn('Speech synthesis error:', error);
      }
    }
  }

  /**
   * Signal that user moved to a new page
   * Reset hesitation detection metrics
   */
  onPageChange() {
    this.screenEntryTime = Date.now();
    this.backButtonPressCount = 0;
    this.dismissHelp();
    console.log('Page changed, hesitation detection reset');
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.inactivityTimeout) clearTimeout(this.inactivityTimeout);
    if (this.screenTimeoutCheck) clearInterval(this.screenTimeoutCheck);
    
    const overlay = document.getElementById('adaptive-help-overlay');
    if (overlay) overlay.remove();
    
    console.log('Adaptive UI destroyed');
  }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.adaptiveUI = new AdaptiveATMUI();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (window.adaptiveUI) {
    window.adaptiveUI.destroy();
  }
});
