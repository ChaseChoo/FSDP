  document.addEventListener("DOMContentLoaded", () => {
    // Icons
    if (window.lucide) {
      window.lucide.createIcons({ attrs: { "stroke-width": 1.5 } });
    }

    // Elements
    const pages = {
      main: document.getElementById("mainMenu"),
      cash: document.getElementById("cashPage"),
      deposit: document.getElementById("depositPage"),
      noncash: document.getElementById("nonCashPage"),
      balance: document.getElementById("balancePage"),
      activate: document.getElementById("activatePage"),
      transfer: document.getElementById("transferPage"),
      transferConfirm: document.getElementById("transferConfirmPage"),
    };

    const chatlog = document.getElementById("chatlog");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const langSelect = document.getElementById("langSelect");
    const langSelectTop = document.getElementById("langSelectTop");
    const micToggle = document.getElementById("micToggle");
    const micToggleLabel = document.getElementById("micToggleLabel");
    const exitBtn = document.getElementById("exitBtn");
    const pendingBanner = document.getElementById('pendingBanner');
    const pendingText = document.getElementById('pendingText');
    const pendingConfirmBtn = document.getElementById('pendingConfirmBtn');
    const pendingCancelBtn = document.getElementById('pendingCancelBtn');
    const successBanner = document.getElementById('successBanner');
    const successText = document.getElementById('successText');

    const tfMode = document.getElementById("tfMode");

    // State
    let currentLang = "en";
    let balance = 0.0; // Will be loaded from API
    let selectedCashAmount = null;
    let navHistory = ["main"];
    let recognition = null;
    let listeningActive = false;
    let hoverReadCooldown = false;
    let cachedVoices = [];
  let tempOtpToken = null;
  let lastOtpIdentifier = null;
    let pendingWithdrawal = null; // { amount: number }

    // Fetch balance from API
    async function loadBalance() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('No token found, using default balance');
          return;
        }

        const response = await fetch('/account/balance', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

      if (response.ok) {
        const data = await response.json();
        balance = parseFloat(data.balance) || 0.0;
        console.log('Balance loaded:', balance);
        updateBalanceUI();
      } else {
        console.error('Failed to fetch balance:', response.status);
      }
    } catch (error) {
      console.error('Error loading balance:', error);
    }
  }

  // Load user name and display in greeting
  function loadUserName() {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        const greeting = document.getElementById('greeting');
        const fullName = user.fullName || user.name;
        if (greeting && fullName) {
          // Extract first name from full name
          const firstName = fullName.split(' ')[0];
          greeting.textContent = `Hello, ${firstName}!`;
        }
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  }

    // I18N dictionaries
    const i18n = {
      en: {
        hello: "Hello!",
        what_do: "What would you like to do today?",
        get_cash: "Get Cash",
        non_cash: "Non Cash Services",
        exit: "Exit",
        other_amount: "Other amount",
        set: "Set",
        confirm: "Confirm",
        back: "Back",
        activate_card: "Activate card",
        balance_enquiry: "Balance enquiry",
        bill_payment: "Bill Payment",
        transfer_funds: "Transfer Funds",
        cpf_services: "CPF Services",
        investment_services: "Investment Services",
        current_balance: "Current balance",
        card_last4: "Card last 4 digits",
        otp: "OTP",
        amount: "Amount",
        to_account: "To Account",
        bank: "Bank",
        payee: "Payee Name",
        payment_mode: "Payment mode",
        non_immediate: "Non-immediate transfer",
        immediate: "Immediate transfer",
        transfer_confirm: "Transfer Confirmation",
        send: "Send",
        listening_on: "Listening",
        listening_off: "Mic Off",
        switched: "Switched to",
        withdraw_msg: "All set! I’ve dispensed your cash.",
        need_amount: "Please select or enter an amount.",
        insufficient: "Insufficient funds.",
        activated: "Nice! Your card is now activated.",
        transfer_done: "Done! Your transfer has been completed.",
        not_understood: "Sorry, I didn’t catch that. Could you try again?",
        withdrawn_now: (amt, bal) =>
          `Withdrew ${formatCurrency(amt)}. Current balance: ${formatCurrency(
            bal
          )}.`,
        balance_is: (bal) => `Your balance is ${formatCurrency(bal)}.`,
      },
      zh: {
        hello: "欢迎！",
        what_do: "今天您想要办理什么业务？",
        get_cash: "取现",
        non_cash: "非现金服务",
        exit: "退出",
        other_amount: "其他金额",
        set: "设定",
        confirm: "确认",
        back: "返回",
        activate_card: "激活卡",
        balance_enquiry: "余额查询",
        bill_payment: "账单支付",
        transfer_funds: "转账汇款",
        cpf_services: "公积金服务",
        investment_services: "投资服务",
        current_balance: "当前余额",
        card_last4: "卡号后四位",
        otp: "验证码",
        amount: "金额",
        to_account: "收款账号",
        bank: "银行",
        payee: "收款人",
        payment_mode: "支付方式",
        non_immediate: "非即时汇款",
        immediate: "即时汇款",
        transfer_confirm: "转账确认",
        send: "发送",
        listening_on: "正在聆听",
        listening_off: "麦克风已关",
        switched: "已切换到",
        withdraw_msg: "好了！现金已取出。",
        need_amount: "请选择或输入金额。",
        insufficient: "余额不足。",
        activated: "好的！银行卡已成功激活。",
        transfer_done: "完成！转账已提交。",
        not_understood: "抱歉，我没听清楚，可以再说一次吗？",
        withdrawn_now: (amt, bal) =>
          `已取出 ${formatCurrency(amt)}。当前余额：${formatCurrency(bal)}。`,
        balance_is: (bal) => `您的余额是 ${formatCurrency(bal)}。`,
      },
      ms: {
        hello: "Hai!",
        what_do: "Apa yang anda ingin lakukan hari ini?",
        get_cash: "Keluarkan Tunai",
        non_cash: "Perkhidmatan Bukan Tunai",
        exit: "Keluar",
        other_amount: "Jumlah lain",
        set: "Tetapkan",
        confirm: "Sahkan",
        back: "Kembali",
        activate_card: "Aktifkan kad",
        balance_enquiry: "Semakan baki",
        bill_payment: "Bayaran Bil",
        transfer_funds: "Pindahan Wang",
        cpf_services: "Perkhidmatan CPF",
        investment_services: "Perkhidmatan Pelaburan",
        current_balance: "Baki semasa",
        card_last4: "4 digit terakhir kad",
        otp: "OTP",
        amount: "Jumlah",
        to_account: "Ke Akaun",
        bank: "Bank",
        payee: "Nama Penerima",
        payment_mode: "Mod bayaran",
        non_immediate: "Pindahan tidak serta-merta",
        immediate: "Pindahan serta-merta",
        transfer_confirm: "Pengesahan Pindahan",
        send: "Hantar",
        listening_on: "Mendengar",
        listening_off: "Mikrofon Dimatikan",
        switched: "Beralih ke",
        withdraw_msg: "Siap! Tunai telah dikeluarkan.",
        need_amount: "Sila pilih atau masukkan jumlah.",
        insufficient: "Baki tidak mencukupi.",
        activated: "Bagus! Kad anda telah diaktifkan.",
        transfer_done: "Selesai! Pindahan berjaya.",
        not_understood: "Maaf, saya kurang faham. Boleh ulang sekali lagi?",
        withdrawn_now: (amt, bal) =>
          `Dikeluarkan ${formatCurrency(amt)}. Baki semasa: ${formatCurrency(
            bal
          )}.`,
        balance_is: (bal) => `Baki anda ialah ${formatCurrency(bal)}.`,
      },
      ta: {
        hello: "வணக்கம்!",
        what_do: "இன்று நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?",
        get_cash: "பணம் எடு",
        non_cash: "பணமல்லா சேவைகள்",
        exit: "வெளியேறு",
        other_amount: "மற்ற தொகை",
        set: "அமை",
        confirm: "உறுதி",
        back: "பின்",
        activate_card: "அட்டை செயற்படுத்து",
        balance_enquiry: "மீதம் பார்க்க",
        bill_payment: "பில் கட்டணம்",
        transfer_funds: "பணம் பரிமாற்றம்",
        cpf_services: "CPF சேவைகள்",
        investment_services: "முதலீட்டு சேவைகள்",
        current_balance: "தற்போதைய இருப்பு",
        card_last4: "அட்டையின் கடைசி 4 எண்கள்",
        otp: "OTP",
        amount: "தொகை",
        to_account: "பெறுநர் கணக்கு",
        bank: "வங்கி",
        payee: "பெறுநர் பெயர்",
        payment_mode: "கட்டண வகை",
        non_immediate: "உடனடி அல்லாத பரிமாற்றம்",
        immediate: "உடனடி பரிமாற்றம்",
        transfer_confirm: "பரிமாற்ற உறுதிப்பு",
        send: "அனுப்பு",
        listening_on: "கேட்டு கொண்டிருக்கிறது",
        listening_off: "மைக் ஆஃப்",
        switched: "மாற்றப்பட்டது",
        withdraw_msg: "சரி! பணம் வழங்கப்பட்டது.",
        need_amount: "தொகையை தேர்ந்தெடுக்கவும் அல்லது உள்ளிடவும்.",
        insufficient: "போதுமான இருப்பு இல்லை.",
        activated: "அருமை! உங்கள் அட்டை செயற்படுத்தப்பட்டது.",
        transfer_done: "முடிந்தது! பரிமாற்றம் நிறைவு.",
        not_understood: "மன்னிக்கவும், புரியவில்லை. மீண்டும் சொல்வீர்களா?",
        withdrawn_now: (amt, bal) =>
          `${formatCurrency(amt)} வழங்கப்பட்டது. தற்போதைய இருப்பு: ${formatCurrency(
            bal
          )}.`,
        balance_is: (bal) => `உங்கள் இருப்பு ${formatCurrency(bal)}.`,
      },
    };

    // Logout functionality
    window.handleLogout = function() {
      // Clear all stored data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('cardNumber');
      sessionStorage.clear();
      
      // Redirect to login page
      window.location.href = 'login.html';
    };

    // Helpers

    function formatCurrency(n) {
      const v = Number(n || 0);
      return "S$" + v.toFixed(2);
    }

    function speechLang(code) {
      return (
        {
          en: "en-US",
          zh: "zh-CN",
          ms: "ms-MY",
          ta: "ta-IN",
        }[code] || "en-US"
      );
    }

    function langName(code) {
      return (
        {
          en: "English",
          zh: "中文",
          ms: "Bahasa Melayu",
          ta: "தமிழ்",
        }[code] || code
      );
    }

    // I18N apply

    function applyI18n() {
      const dict = i18n[currentLang];

      document
        .querySelectorAll(".atm-i18n[data-i18n]")
        .forEach((el) => {
          const key = el.getAttribute("data-i18n");
          if (dict[key]) el.textContent = dict[key];
        });

      document
        .querySelectorAll("[data-i18n-placeholder]")
        .forEach((el) => {
          const key = el.getAttribute("data-i18n-placeholder");
          if (dict[key]) {
            el.setAttribute("placeholder", dict[key]);
          }
        });

      if (tfMode) {
        tfMode.options[0].textContent = dict.non_immediate;
        tfMode.options[1].textContent = dict.immediate;
      }

      updateBalanceUI();
    }

    function switchLang(newLang) {
      currentLang = newLang;
      if (langSelect) langSelect.value = newLang;
      if (langSelectTop) langSelectTop.value = newLang;
      applyI18n();
      if (chatlog) {
      chatlog.innerHTML = "";
      }
      const msg = `${i18n[currentLang].switched} ${langName(newLang)}.`;
      logBot(msg);
      speak(msg);
      if (recognition) recognition.lang = speechLang(newLang);
    }

    // Logging

    function logBot(text) {
      if (!chatlog) return;
      const div = document.createElement("div");
      div.textContent = "🤖 " + text;
      chatlog.appendChild(div);
      chatlog.scrollTop = chatlog.scrollHeight;
    }

    function logUser(text) {
      if (!chatlog) return;
      const div = document.createElement("div");
      div.textContent = "🧍 " + text;
      chatlog.appendChild(div);
      chatlog.scrollTop = chatlog.scrollHeight;
    }

    // Pages

    function updatePageVisibility() {
      Object.values(pages).forEach((el) => {
        if (!el) return;
        el.classList.contains("active")
          ? (el.style.display = "block")
          : (el.style.display = "none");
      });
    }

    function showPage(name) {
      Object.values(pages).forEach((el) => el && el.classList.remove("active"));
      const target = pages[name];
      if (!target) return;
      target.classList.add("active");
      navHistory.push(name);
      updatePageVisibility();
      // Reset chat log for neatness when entering a new page
      try{
        if(chatlog) chatlog.innerHTML = '';
        if(window.speechSynthesis && window.speechSynthesis.cancel) window.speechSynthesis.cancel();
      }catch(e){}
      // Announce numeric options for the page (ATM numeric-pad friendly)
      displayMenuOptions(name);
      // notify other widgets/pages that page changed
      try{ document.dispatchEvent(new CustomEvent('atmPageChange',{detail:{page:name}})); }catch(e){}
    }

    function goBack() {
      if (navHistory.length > 1) navHistory.pop();
      const prev = navHistory.pop() || "main";
      showPage(prev);
    }

    document
      .querySelectorAll(".backBtn")
      .forEach((btn) => btn.addEventListener("click", goBack));

    // Exit: reset to main
    if (exitBtn) {
      exitBtn.addEventListener("click", () => {
        selectedCashAmount = null;
        const cashOther = document.getElementById("cashOther");
        if (cashOther) cashOther.value = "";
        document
          .querySelectorAll(".denom-btn")
          .forEach((b) => b.classList.remove("selected"));
        navHistory = ["main"];
        showPage("main");
      });
    }

    // Main nav buttons (some IDs appear twice: use querySelectorAll)
    document
      .querySelectorAll("#btnCash")
      .forEach((el) => el.addEventListener("click", () => showPage("cash")));
    document
      .querySelectorAll("#btnNonCash")
      .forEach((el) => el.addEventListener("click", () => showPage("noncash")));
    document
      .querySelectorAll("#btnBalance")
      .forEach((el) =>
        el.addEventListener("click", () => {
          updateBalanceUI();
          showPage("balance");
        })
      );
    document
      .querySelectorAll("#btnActivateCard")
      .forEach((el) =>
        el.addEventListener("click", () => showPage("activate"))
      );
    document
  .querySelectorAll("#btnTransfer")
  .forEach((el) =>
    el.addEventListener("click", () => {
      window.location.href = "index.html";
    })
  );


    ["btnBill", "btnCPF", "btnInvest"].forEach((id) => {
      document.querySelectorAll(`#${id}`).forEach((el) =>
        el.addEventListener("click", () => {
          logBot(el.textContent.trim() + " – (demo) coming soon.");
        })
      );
    });         

    // Balance

    function updateBalanceUI() {
      const el = document.getElementById("balanceValue");
      if (el) el.textContent = formatCurrency(balance);
    }

    // Cash: denom + custom

    const denomButtons = Array.from(document.querySelectorAll(".denom-btn"));

    denomButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        denomButtons.forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        selectedCashAmount = parseFloat(btn.dataset.amount);
      });
    });

    const cashOtherInput = document.getElementById("cashOther");
    const cashOtherSet = document.getElementById("cashOtherSet");
    const cashConfirm = document.getElementById("cashConfirm");

    if (cashOtherSet && cashOtherInput) {
      cashOtherSet.addEventListener("click", () => {
        const val = parseFloat(cashOtherInput.value || "0");
        if (val > 0) {
          denomButtons.forEach((b) => b.classList.remove("selected"));
          selectedCashAmount = val;
          logBot(`${formatCurrency(val)} set as withdrawal amount.`);
        }
      });
    }

    if (cashConfirm) {
      cashConfirm.addEventListener("click", () => {
        immediateWithdraw(selectedCashAmount);
      });
    }

    async function immediateWithdraw(amount) {
      const dict = i18n[currentLang];
      const amt = parseFloat(amount || 0);

      if (!amt || amt <= 0) {
        logBot(dict.need_amount);
        speak(dict.need_amount);
        return;
      }

      if (balance < amt) {
        logBot(`${dict.insufficient} (${formatCurrency(balance)})`);
        speak(dict.insufficient);
        return;
      }

      // Call API to process withdrawal
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/account/withdraw', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ amount: amt, description: 'ATM withdrawal' })
        });

        if (response.ok) {
          const data = await response.json();
          balance = parseFloat(data.newBalance) || balance - amt;
          updateBalanceUI();
          logBot(dict.withdrawn_now(amt, balance));
          speak(dict.withdraw_msg);
          // show a brief on-screen success confirmation
          try{ showSuccessBanner('Withdraw successful — ' + formatCurrency(amt)); }catch(e){}
          // hide pending banner if present
          try{ hidePendingBanner(); }catch(e){}
          // after a short delay return to main menu so user sees confirmation
          setTimeout(()=>{ showPage("main"); }, 900);
        } else {
          const error = await response.json();
          logBot(`Error: ${error.error || 'Withdrawal failed'}`);
          speak('Transaction failed. Please try again.');
        }
      } catch (error) {
        console.error('Withdrawal error:', error);
        logBot('Network error. Please try again.');
        speak('Network error. Please try again.');
      }
    }

    // Numeric menu system (ATM number-pad friendly)
    let currentMenuPage = "main";

    const menuMap = {
      main: [
        { key: 1, label: "Get Cash", action: () => showPage("cash") },
        { key: 2, label: "Non Cash Services", action: () => showPage("noncash") },
        { key: 3, label: "Balance enquiry", action: () => { updateBalanceUI(); showPage("balance"); } },
        { key: 4, label: "Activate card", action: () => showPage("activate") },
        { key: 5, label: "Transfer funds", action: () => showPage("transfer") },
        { key: 6, label: "Deposit cash", action: () => showPage("deposit") },
      ],
      noncash: [
        { key: 1, label: "Balance enquiry", action: () => { updateBalanceUI(); showPage("balance"); } },
        { key: 2, label: "Transfer funds", action: () => showPage("transfer") },
        { key: 3, label: "Activate card", action: () => showPage("activate") },
        { key: 9, label: "Back", action: () => goBack() },
      ],
      cash: [
        { key: 1, label: "S$50", action: () => selectDenomAmount(50) },
        { key: 2, label: "S$80", action: () => selectDenomAmount(80) },
        { key: 3, label: "S$100", action: () => selectDenomAmount(100) },
        { key: 4, label: "S$500", action: () => selectDenomAmount(500) },
        { key: 5, label: "Other amount", action: () => promptOtherAmount() },
        { key: 9, label: "Confirm", action: () => immediateWithdraw(selectedCashAmount) },
      ],
      transfer: [
        { key: 1, label: "Enter amount", action: () => focusTransferField(0) },
        { key: 2, label: "To account", action: () => focusTransferField(1) },
        { key: 3, label: "Bank", action: () => focusTransferField(2) },
        { key: 4, label: "Payee name", action: () => focusTransferField(3) },
        { key: 9, label: "Confirm", action: () => showPage("transferConfirm") },
      ],
      activate: [
        { key: 1, label: "Card last 4", action: () => focusActivateField(0) },
        { key: 2, label: "Enter OTP", action: () => focusActivateField(1) },
        { key: 9, label: "Confirm", action: () => document.getElementById("activateConfirm") && document.getElementById("activateConfirm").click() },
      ],
    };

    function displayMenuOptions(page) {
      currentMenuPage = page || "main";
      const opts = menuMap[currentMenuPage] || menuMap.main;
      if (!opts || !opts.length) return;
      // Log numbered options to the chat so user can press numbers on keypad
      logBot("Options:");
      const labels = opts.map((o) => `${o.key} — ${o.label}`);
      labels.forEach((l) => logBot(l));
      try {
        // Speak a short prompt (not every option to avoid long speech)
        speak("Press a number to choose an option.");
      } catch {}
    }

    function getCurrentActivePage() {
      for (const k of Object.keys(pages)) {
        const el = pages[k];
        if (el && el.classList.contains("active")) return k;
      }
      return "main";
    }

    function handleNumericSelection(input) {
      const key = parseInt((input || "").toString().trim(), 10);
      if (Number.isNaN(key)) return false;
      const page = currentMenuPage || getCurrentActivePage();
      const opts = menuMap[page] || menuMap.main;
      const found = opts.find((o) => o.key === key);
      if (!found) {
        logBot(i18n[currentLang].not_understood || "Invalid selection.");
        speak(i18n[currentLang].not_understood || "Invalid selection.");
        return true;
      }
      // Execute action
      try {
        found.action();
      } catch (e) {
        console.error(e);
      }
      return true;
    }

    function selectDenomAmount(amount) {
      denomButtons.forEach((b) => b.classList.remove("selected"));
      const btn = denomButtons.find((b) => parseFloat(b.dataset.amount) === amount);
      if (btn) btn.classList.add("selected");
      selectedCashAmount = amount;
      logBot(`${formatCurrency(amount)} selected.`);
    }

    function promptOtherAmount() {
      const el = document.getElementById("cashOther");
      if (el) {
        el.focus();
        logBot("Enter the amount using the number pad, then press Set.");
        speak("Enter the amount then press Set.");
      }
    }

    function focusTransferField(index) {
      const inputs = Array.from(document.querySelectorAll("#transferPage .field-input"));
      if (inputs[index]) {
        inputs[index].focus();
        logBot("Focused " + (inputs[index].placeholder || "field") + ". Enter digits then Confirm.");
      }
    }

    function focusActivateField(index) {
      const inputs = Array.from(document.querySelectorAll("#activatePage .field-input"));
      if (inputs[index]) {
        inputs[index].focus();
        logBot("Focused " + (inputs[index].placeholder || "field") + ".");
      }
    }

    // Try to convert simple number words to numbers (e.g., "fifty" -> 50)
    function wordsToNumber(str) {
      if (!str) return null;
      const small = {
        zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
        ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16,
        seventeen:17, eighteen:18, nineteen:19
      };
      const tens = { twenty:20, thirty:30, forty:40, fifty:50, sixty:60, seventy:70, eighty:80, ninety:90 };
      const parts = str.toLowerCase().replace(/[^a-z0-9\s-]/g,' ').split(/\s|-/).filter(Boolean);
      let total = 0; let last = 0;
      for (const p of parts) {
        if (small[p] !== undefined) { last += small[p]; }
        else if (tens[p] !== undefined) { last += tens[p]; }
        else if (p === 'hundred') { last = last === 0 ? 100 : last * 100; }
        else if (/^\d+$/.test(p)) { last += parseInt(p,10); }
        else if (/^(\d+)(\.\d+)?$/.test(p)) { last += parseFloat(p); }
        else { /* ignore unknown words */ }
      }
      total += last;
      return total || null;
    }

    // Flash/highlight all major options briefly (used when ATM announces ready)
    function flashAllOptions(duration = 1200) {
      try{
        const selectors = ['.cta-card', '.tile-card', '.denom-btn', '.btn-primary'];
        const els = Array.from(document.querySelectorAll(selectors.join(',')));
        els.forEach((el)=> el.classList.add('flash-highlight'));
        setTimeout(()=> els.forEach((el)=> el.classList.remove('flash-highlight')), duration);
      }catch(e){}
    }

    // Virtual teller simulation: show/close helpers
    // Virtual teller message renderer (with avatar + bubble)
    function appendVTMessage(kind, text){
      try{
        const box = document.getElementById('vtMessages');
        if(!box) return;
        const row = document.createElement('div'); row.className = 'vt-row ' + (kind==='user' ? 'user' : 'agent');
        const avatar = document.createElement('div'); avatar.className = 'vt-avatar ' + (kind==='user' ? 'user' : 'agent');
        avatar.setAttribute('aria-hidden','true');
        avatar.textContent = (kind==='user' ? 'G' : 'A');
        const bubble = document.createElement('div'); bubble.className = 'vt-bubble';
        bubble.textContent = text;
        if(kind === 'user') { row.appendChild(bubble); row.appendChild(avatar); }
        else { row.appendChild(avatar); row.appendChild(bubble); }
        box.appendChild(row);
        box.scrollTop = box.scrollHeight;
        try{ if(kind !== 'user') speak(text); }catch(e){}
      }catch(e){ console.error(e); }
    }

    function showVirtualTeller(initialAgentText){
      try{
        const overlay = document.getElementById('virtualTellerOverlay');
        const status = document.getElementById('vtStatus');
        const messages = document.getElementById('vtMessages');
        const input = document.getElementById('vtInput');
        const send = document.getElementById('vtSend');
        const close = document.getElementById('vtClose');
        const vtMicBtn = document.getElementById('vtMic');
        const vtCloseBtn = document.getElementById('vtCloseBtn');
        if(!overlay) return;
        messages.innerHTML = '';
        overlay.style.display = 'block'; overlay.setAttribute('aria-hidden','false');
        status.textContent = 'Connecting to your virtual teller...';
        // simulate connection then show video and messages once connected
        setTimeout(()=>{
          status.textContent = 'Connected — Virtual Teller (Alex)';
          appendVTMessage('agent', 'Hello, I am Alex, your virtual teller. How may I assist you today?');
          if(initialAgentText) appendVTMessage('agent', initialAgentText);
          // After connecting, try to load the pre-recorded video from the atm videos folder
          try{
            const vtVideo = document.getElementById('vtVideo');
            if(vtVideo){
              // path to the video inside the repo. Replace filename if different.
              const videoPath = 'atm videos/video_2025-11-24_14-05-19.mp4';
              vtVideo.style.display = 'block';
              vtVideo.muted = true; // keep muted so autoplay works; user can press Join to unmute
              vtVideo.playsInline = true;
              vtVideo.loop = true;
              // set or update src
              const encoded = encodeURI(videoPath);
              if(!vtVideo.src || !vtVideo.src.includes(encoded)) vtVideo.src = encoded;
              try{ vtVideo.load(); }catch(e){}
              const p = vtVideo.play();
              if(p && p.catch) p.catch(()=>{/* autoplay may be blocked until user interacts */});
            }
          }catch(e){ console.error('VT video load error', e); }
          // start VT mic auto-listen if supported
          try{ startVTListening(); if(vtMicBtn) vtMicBtn.setAttribute('aria-pressed','true'); }catch(e){}
        }, 1100);

        if(send) send.onclick = ()=>{ const v = (input.value||'').trim(); if(!v) return; appendVTMessage('user', v); input.value=''; setTimeout(()=> appendVTMessage('agent', 'Thanks — I will process that and get back to you.'), 700); };
        if(vtMicBtn) vtMicBtn.onclick = ()=>{ const pressed = vtMicBtn.getAttribute('aria-pressed') === 'true'; if(pressed) stopVTListening(); else startVTListening(); vtMicBtn.setAttribute('aria-pressed', (!pressed).toString()); };
        // Unmute / Join Call button: enables audio on the pre-recorded video (user gesture required)
        const vtUnmuteBtn = document.getElementById('vtUnmute');
        if(vtUnmuteBtn) {
          vtUnmuteBtn.onclick = ()=>{
            try{
              const vtVideo = document.getElementById('vtVideo');
              if(!vtVideo) return;
              vtVideo.muted = false;
              const p = vtVideo.play();
              if(p && p.catch) p.catch(()=>{});
              vtUnmuteBtn.textContent = '🔈 Joined';
              vtUnmuteBtn.setAttribute('aria-pressed','true');
              // Announce join via TTS as fallback
              try{ speak('You have joined the call and enabled audio.'); }catch(e){}
            }catch(e){ console.error('vtUnmute error', e); }
          };
        }
        if(vtCloseBtn) vtCloseBtn.onclick = ()=> closeVirtualTeller();
        if(close) close.onclick = ()=> closeVirtualTeller();
      }catch(e){ console.error(e); }
    }

    function closeVirtualTeller(){
      try{ 
        const overlay = document.getElementById('virtualTellerOverlay'); 
        if(!overlay) return; 
        // pause and hide video when closing
        try{ const vtVideo = document.getElementById('vtVideo'); if(vtVideo){ vtVideo.pause(); vtVideo.currentTime = 0; vtVideo.style.display = 'none'; } }catch(e){}
        overlay.style.display='none'; overlay.setAttribute('aria-hidden','true'); stopVTListening(); 
      }catch(e){}
    }

    // VT-specific SpeechRecognition (independent from main recognition)
    let vtRecognition = null;
    let vtListening = false;
    function startVTListening(){
      if(vtListening) return;
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if(!SR) { appendVTMessage('agent','Voice input not supported in this browser.'); return; }
      vtRecognition = new SR();
      vtRecognition.lang = speechLang(currentLang);
      vtRecognition.interimResults = false;
      vtRecognition.continuous = true;
      vtRecognition.onresult = (e)=>{
        const txt = e.results[e.results.length-1][0].transcript.trim();
        appendVTMessage('user', txt);
        // simulate processing and agent reply
        setTimeout(()=>{ appendVTMessage('agent', 'Thanks — I have noted your request: ' + txt); }, 700);
      };
      vtRecognition.onend = ()=>{ if(vtListening){ try{ vtRecognition.start(); }catch(e){} } };
      try{ vtRecognition.start(); vtListening = true; }catch(e){ console.error(e); vtListening=false; }
    }

    function stopVTListening(){
      try{ if(vtRecognition){ vtRecognition.onend = null; vtRecognition.stop(); vtRecognition = null; } vtListening = false; const btn = document.getElementById('vtMic'); if(btn) btn.setAttribute('aria-pressed','false'); }catch(e){}
    }

    // Handle commands from input / voice

    function handleCommand(raw) {
      const text = (raw || "").trim();
      if (!text) return;
      const lower = text.toLowerCase();

      // If we have a pending withdrawal, accept confirmation via voice/text
      if (pendingWithdrawal) {
        const affirm = /(yes|confirm|okay|ok|confirmar|ya|sure)/i;
        const deny = /(no|cancel|not now|don't|dont|nope)/i;
        if (affirm.test(lower)) {
          logBot(`Confirmed. Processing withdrawal of ${formatCurrency(pendingWithdrawal)}.`);
          speak(`Confirmed. Dispensing ${formatCurrency(pendingWithdrawal)}.`);
          hidePendingBanner();
          immediateWithdraw(pendingWithdrawal);
          pendingWithdrawal = null;
          return;
        }
        if (deny.test(lower)) {
          logBot('Withdrawal cancelled.');
          speak('Cancelled.');
          hidePendingBanner();
          pendingWithdrawal = null;
          return;
        }
        // if neither yes/no, prompt user to confirm
        logBot('Please say "yes" to confirm or "no" to cancel.');
        speak('Please say yes to confirm or no to cancel.');
        return;
      }

      // If a deposit is in progress (counting), allow voice to cancel or confirm
      if (depositInProgress) {
        const affirm = /(yes|confirm|okay|ok|sure|continue)/i;
        const deny = /(no|cancel|stop|abort|don't|dont|nope)/i;
        if (deny.test(lower)) {
          // cancel deposit counting
          try{ if(countInterval) { clearInterval(countInterval); countInterval = null; } resetCountingUI(); depositInProgress = null; logBot('Deposit cancelled.'); speak('Cancelled.'); }catch(e){}
          return;
        }
        if (affirm.test(lower) && depositInProgress.inserted && depositInProgress.inserted>0) {
          try{ const amt = depositInProgress.inserted; finalizeDeposit(amt); }catch(e){}
          return;
        }
      }

      // If the user input is numeric-only, route to numeric menu handler
      if (/^\d{1,6}$/.test(text)) {
        handleNumericSelection(text);
        return;
      }

      // If user input is numeric-only, treat as numeric menu selection or amount
      const numericOnly = /^\s*\d+\s*$/.test(text);
      if (numericOnly) {
        const handled = handleNumericSelection(text);
        if (handled) return;
      }

      const numMatch = text.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
      const amount = numMatch ? parseFloat(numMatch[1]) : null;

      const intents = {
        withdraw:
          /(withdraw|get cash|取现|提取|提款|keluar|pengeluaran|tarik|wang|பணம் எடு|எடு|வெளியேற்று)/i,
        deposit:
          /(deposit|top up|top-up|topup|insert cash|存入|存款|depositar|simpan|masukkan|setorkan)/i,
        balance:
          /(balance|余额|baki|இருப்பு|semakan baki|check balance)/i,
        transfer:
          /(transfer|转账|汇款|pindah|pindahan|பரிமாற்றம்)/i,
        activate:
          /(activate|激活|aktif|aktifkan|செயற்படுத்து)/i,
        menu: /(menu|home|主菜单|首页|utama|முகப்பு)/i,
        lang_en: /(english|inggeris|ஆங்கிலம்)/i,
        lang_zh: /(chinese|中文|华文|中文语言)/i,
        lang_ms: /(malay|bahasa melayu)/i,
        lang_ta: /(tamil|தமிழ்)/i,
      };


      if (intents.lang_en.test(lower)) return switchLang("en");
      if (intents.lang_zh.test(lower)) return switchLang("zh");
      if (intents.lang_ms.test(lower)) return switchLang("ms");
      if (intents.lang_ta.test(lower)) return switchLang("ta");

      if (intents.withdraw.test(lower)) {
        if (amount) {
          // ask for confirmation before dispensing
          pendingWithdrawal = amount;
          logBot(`You requested to withdraw ${formatCurrency(amount)}. Please confirm (yes/no).`);
          speak(`You requested to withdraw ${formatCurrency(amount)}. Please confirm.`);
          showPendingBanner(amount);
          return;
        }
        showPage("cash");
        logBot(i18n[currentLang].need_amount);
        speak(i18n[currentLang].need_amount);
        return;
      }

      if (intents.deposit.test(lower)) {
        // try extract numeric amount from spoken text, including words
        const numMatch = text.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
        let amount = numMatch ? parseFloat(numMatch[1]) : null;
        if (!amount) {
          const byWords = wordsToNumber(text);
          if (byWords) amount = byWords;
        }
        if (amount) {
          // Go to deposit page and start deposit flow with expected amount
          logBot(`Starting deposit of ${formatCurrency(amount)}. Please insert cash.`);
          speak(`Starting deposit of ${amount} dollars. Please insert cash.`);
          showPage('deposit');
          // small delay so UI changes are visible before starting counting
          setTimeout(()=> startDeposit(amount), 400);
          return;
        }
        // otherwise show deposit page
        showPage('deposit');
        logBot('Please enter the amount to deposit then press Insert Cash.');
        speak('Please enter the amount to deposit then press Insert Cash.');
        return;
      }

      // PayNow quick intent: recognize 'pay now', 'paynow', 'scan qr', or 'send to <phone>' phrases
      const paynowRegex = /(pay\s?now|paynow|scan qr|scan code|pay to|send to phone|pay via phone)/i;
      // Complex requests: use language-aware regexes for better coverage (change particulars, GIRO, cheque-book, passbook, etc.)
      // Allow conversational prefixes and more variants (e.g. "can you help me change my particulars")
      const complexRequestsEn = /(?:\b(?:can you|could you|please|i want to|i'd like to|i would like to|i need to|help me|would you|can i)\b[\s,:-]*)?(?:change(?:\s+(?:of|my|the))?\s+particulars|update(?:\s+(?:my|the))?\s+(?:details|contact|mobile|phone|address|personal information)|change(?:\s+(?:my|the))?\s+mobile(?:\s+number)?|update(?:\s+(?:my|the))?\s+mobile|change\s+contact(?:\s+number)?|update\s+contact|change\s+phone|update\s+phone|change\s+address|update\s+address|change\s+of\s+details|change\s+giro(?:\s+(?:payment\s+)?limit)?|update\s+giro(?:\s+limit)?|giro\s+limit|increase\s+giro\s+limit|decrease\s+giro\s+limit|cancel\s+giro|delete\s+giro(?:\s+arrangement)?|terminate\s+giro|stop\s+giro|close\s+giro(?:\s+arrangement)?|request(?:\s+an?)?\s+(?:additional|extra|new)?\s*(?:cheque|check)\s*(?:book|books)?|order(?:\s+an?)?\s*(?:cheque|check)\s*(?:book|books)?|apply(?:\s+for)?\s+(?:additional|extra)\s*(?:cheque|check)\s*book|replacement\s+of\s+passbook|replace\s+passbook|lost\s+passbook|new\s+passbook|request\s+passbook|order\s+passbook|replacement\s+passbook|request\s+an?\s+additional\s+cheque\s+book)/i;
      const complexRequestsZh = /(更改(?:\s*资料|\s*資料|\s*信息)?|更新(?:\s*资料|\s*信息)?|更换(?:\s*手机|\s*号码)?|更改手机号|更新手机号码|更改地址|更改收款资料|更改GIRO|修改GIRO|取消GIRO|终止GIRO|删除GIRO|申请支票簿|订购支票簿|补发支票簿|补发存折|更换存折|遗失存折)/i;
      const complexRequestsMs = /(kemas\s*?kini|kemasukan|ubah|tukar\s*(?:nombor|telefon|telefon\s*?bimbit)?|tukar\s*alamat|tukar\s*giro|batalkan\s*giro|hentikan\s*arahan\s*tetap|minta\s*buku\s*cek|pesan\s*buku\s*cek|gantikan\s*buku\s*simpanan)/i;
      const complexRequestsTa = /(விவரங்களைக்\s*கொடுக்க|மொபைல்\s*மாற்று|முகவரி\s*மாற்று|GIRO\s*கட்டுப்பாடு\s*மாற்று|GIRO\s*ரத்து|பேச்சு\s*புத்தகம்\s*கோரிக்கை|பாஸ்புக்\s*மாற்று)/i;

      // language-aware matching for complex requests -> open Virtual Teller
      try {
        const isComplex = (currentLang === 'zh' && complexRequestsZh.test(lower)) ||
                          (currentLang === 'ms' && complexRequestsMs.test(lower)) ||
                          (currentLang === 'ta' && complexRequestsTa.test(lower)) ||
                          complexRequestsEn.test(lower);
        if (isComplex) {
          logBot("I can't assist with this request directly. I'll connect you to a virtual teller.");
          speak("I can't assist with this. I'll connect you to a virtual teller.");
          try{ showVirtualTeller('User requested: ' + text); }catch(e){}
          return;
        }
      } catch(e) { console.error('complex request matching error', e); }

      if (paynowRegex.test(lower)) {
        // Robust PayNow parsing: accept "paynow <phone> <amount>", "paynow <amount> <phone>", or partials.
        // Normalize digits (allow +65, spaces)
        const phoneMatch = text.match(/(\+?\d[\d\s-]{6,20}\d)/g) || [];
        // prefer an 8-digit match if present
        let recipient = null;
        if (phoneMatch && phoneMatch.length) {
          // find first token that has 7-15 digits when non-digits removed
          for (const pm of phoneMatch) {
            const digits = pm.replace(/\D/g, '');
            if (digits.length >= 7 && digits.length <= 15) { recipient = digits; break; }
          }
        }

        // extract amount (digits or words)
        let amt = null;
        // match explicit SGD like '50' or '50.00' near the phone or anywhere
        const amtNumMatch = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
        if (amtNumMatch) amt = parseFloat(amtNumMatch[1]);
        if (!amt) {
          const byWords = wordsToNumber(text);
          if (byWords) amt = byWords;
        }

        // If both recipient and amount present -> go to confirm page
        if (recipient && amt) {
          try{
            localStorage.setItem('paynow_method', 'Phone');
            localStorage.setItem('paynow_recipient', String(recipient));
            localStorage.setItem('paynow_amount', String(amt));
          }catch(e){}
          logBot(`Preparing PayNow to ${recipient} for ${formatCurrency(amt)}. Redirecting to confirmation.`);
          speak(`Preparing PayNow to ${amt} dollars. Redirecting to confirmation.`);
          setTimeout(()=> { window.location.href = 'confirm-paynow.html'; }, 700);
          return;
        }

        // If only recipient or only amount present, prefill PayNow form and open PayNow page
        try{
          if (recipient) {
            localStorage.setItem('paynow_method', 'Phone');
            localStorage.setItem('paynow_recipient', String(recipient));
            logBot(`Opening PayNow form with recipient ${recipient}.`);
            speak(`Opening PayNow form for ${recipient}.`);
            setTimeout(()=> { window.location.href = 'paynow.html'; }, 600);
            return;
          }
          if (amt) {
            localStorage.setItem('paynow_amount', String(amt));
            logBot(`Opening PayNow form with amount ${formatCurrency(amt)}.`);
            speak(`Opening PayNow form for ${amt} dollars.`);
            setTimeout(()=> { window.location.href = 'paynow.html'; }, 600);
            return;
          }
        }catch(e){/* ignore */}

        // default: open PayNow page so user can enter details
        logBot('Opening PayNow form. Please enter recipient and amount.');
        speak('Opening PayNow form. Please enter recipient and amount.');
        setTimeout(()=> { window.location.href = 'paynow.html'; }, 600);
        return;
      }

      if (intents.balance.test(lower)) {
        logBot(i18n[currentLang].balance_is(balance));
        speak(i18n[currentLang].balance_is(balance));
        updateBalanceUI();
        showPage("balance");
        return;
      }

      if (intents.transfer.test(lower)) {
        showPage("transfer");
        logBot(i18n[currentLang].switched + " Transfer.");
        return;
      }

      if (intents.activate.test(lower)) {
        showPage("activate");
        return;
      }

      if (intents.menu.test(lower)) {
        showPage("main");
        return;
      }

      logBot(i18n[currentLang].not_understood);
      speak(i18n[currentLang].not_understood);
    }

    if (sendBtn && userInput) {
      sendBtn.addEventListener("click", () => {
        const text = userInput.value.trim();
        if (!text) return;
        logUser(text);
        handleCommand(text);
        userInput.value = "";
      });
    }

    // TTS

    function loadVoices() {
      if (!("speechSynthesis" in window)) return;
      cachedVoices = window.speechSynthesis.getVoices();
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }

    function pickVoice(langCode) {
      if (!cachedVoices || !cachedVoices.length) return null;
      const patterns =
        {
          en: [/English/i],
          zh: [/Chinese|zh/i],
          ms: [/Malay|ms/i],
          ta: [/Tamil|ta/i],
        }[langCode] || [];
      for (const p of patterns) {
        const found = cachedVoices.find(
          (v) => p.test(v.name) || p.test(v.lang)
        );
        if (found) return found;
      }
      return (
        cachedVoices.find((v) =>
          v.lang.toLowerCase().startsWith(langCode)
        ) || cachedVoices[0]
      );
    }

    function speak(text) {
      if (!text || !("speechSynthesis" in window)) return;
      const u = new SpeechSynthesisUtterance(text);
      u.lang = speechLang(currentLang);
      const v = pickVoice(currentLang);
      if (v) u.voice = v;
      u.rate = 1.0;
      u.pitch = 1.1;
      u.volume = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }

    // Hover-to-speak

    function readElementLabel(el) {
      if (hoverReadCooldown) return;
      let text =
        el.getAttribute("data-i18n") &&
        i18n[currentLang][el.getAttribute("data-i18n")]
          ? i18n[currentLang][el.getAttribute("data-i18n")]
          : (el.textContent || "").trim();
      if (!text) return;
      hoverReadCooldown = true;
      speak(text);
      setTimeout(() => {
        hoverReadCooldown = false;
      }, 600);
    }

    function registerHoverTTS() {
      document
        .querySelectorAll(".hover-tts")
        .forEach((el) => {
          el.addEventListener("mouseenter", () =>
            readElementLabel(el)
          );
        });
    }

    registerHoverTTS();

    // Pending banner helpers
    let pendingTimer = null;
    function showPendingBanner(amount){
      try{
        if(!pendingBanner) return;
        pendingText.textContent = `You requested to withdraw ${formatCurrency(amount)}. Confirm?`;
        pendingBanner.style.display = 'block';
        pendingBanner.classList.add('visible');
        pendingBanner.setAttribute('aria-hidden','false');
        // start auto-cancel after 30s
        if(pendingTimer) clearTimeout(pendingTimer);
        pendingTimer = setTimeout(()=>{
          // auto-cancel
          try{
            if(pendingWithdrawal){
              logBot('Pending withdrawal timed out and was cancelled.');
              speak('Request timed out. Cancelled.');
              pendingWithdrawal = null;
            }
            hidePendingBanner();
          }catch(e){}
        }, 30000);
      }catch(e){}
    }
    function hidePendingBanner(){
      try{
        if(!pendingBanner) return;
        pendingBanner.classList.remove('visible');
        // allow animation then hide
        setTimeout(()=>{ try{ pendingBanner.style.display = 'none'; pendingBanner.setAttribute('aria-hidden','true'); }catch(e){} }, 320);
        if(pendingTimer){ clearTimeout(pendingTimer); pendingTimer = null; }
      }catch(e){}
    }

    // Success banner helpers
    let successTimer = null;
    function showSuccessBanner(msg, ms = 3500){
      try{
        if(!successBanner) return;
        successText.textContent = msg || 'Success';
        successBanner.style.display = 'block';
        successBanner.classList.add('visible');
        successBanner.setAttribute('aria-hidden','false');
        if(successTimer) clearTimeout(successTimer);
        successTimer = setTimeout(()=>{ hideSuccessBanner(); }, ms);
      }catch(e){}
    }
    function hideSuccessBanner(){
      try{
        if(!successBanner) return;
        successBanner.classList.remove('visible');
        setTimeout(()=>{ try{ successBanner.style.display = 'none'; successBanner.setAttribute('aria-hidden','true'); }catch(e){} }, 320);
        if(successTimer) { clearTimeout(successTimer); successTimer = null; }
      }catch(e){}
    }

    if(pendingConfirmBtn){ pendingConfirmBtn.addEventListener('click', ()=>{
      if(!pendingWithdrawal) return;
      logBot(`Confirmed. Processing withdrawal of ${formatCurrency(pendingWithdrawal)}.`);
      speak(`Confirmed. Dispensing ${formatCurrency(pendingWithdrawal)}.`);
      hidePendingBanner();
      immediateWithdraw(pendingWithdrawal);
      pendingWithdrawal = null;
    }); }
    if(pendingCancelBtn){ pendingCancelBtn.addEventListener('click', ()=>{
      if(!pendingWithdrawal) return;
      logBot('Withdrawal cancelled.');
      speak('Cancelled.');
      hidePendingBanner();
      pendingWithdrawal = null;
    }); }

    // Deposit flow elements
    const depositAmountEl = document.getElementById('depositAmount');
    const startInsertBtn = document.getElementById('startInsert');
    const countingBox = document.getElementById('countingBox');
    const countingText = document.getElementById('countingText');
    const countBar = document.getElementById('countBar');

    let depositInProgress = null; // { expected: number, inserted: number }
    let countInterval = null;

    function resetCountingUI(){
      try{ if(countingBox) countingBox.style.display = 'none'; if(countBar) countBar.style.width = '0%'; if(countingText) countingText.textContent = 'Waiting for cash insertion...'; }catch(e){}
    }

    function startDeposit(expected){
      if(!expected || expected <= 0) expected = 0;
      depositInProgress = { expected: expected, inserted: 0 };
      // show counting UI
      try{ if(countingBox) countingBox.style.display = 'block'; if(countBar) countBar.style.width = '0%'; }catch(e){}
      logBot('Please insert the cash into the deposit slot now.');
      speak('Please insert the cash into the deposit slot now.');
      // simulate counting: over ~2.5s update progress then produce final amount
      let progress = 0; const steps = 25; const totalMs = 2500; const stepMs = totalMs/steps;
      if(countInterval) clearInterval(countInterval);
      countInterval = setInterval(()=>{
        progress += 1;
        try{ if(countBar) countBar.style.width = (progress/steps*100)+'%'; }catch(e){}
        if(progress >= steps){
          clearInterval(countInterval); countInterval = null;
          // simulate inserted amount: if expected provided, use it; else random small amount
          const inserted = depositInProgress.expected && depositInProgress.expected>0 ? depositInProgress.expected : Math.floor((Math.random()*200)+10);
          depositInProgress.inserted = inserted;
          try{ if(countingText) countingText.textContent = `Counted S$${inserted.toFixed(2)}`; }catch(e){}
          logBot(`Counted ${formatCurrency(inserted)}.`);
          speak(`Counted ${inserted} dollars.`);
          // verify
          setTimeout(()=>{ finalizeDeposit(inserted); }, 600);
        }
      }, stepMs);
    }

    async function finalizeDeposit(amount){
      // confirm amount against expected (if provided) and update balance
      const expected = depositInProgress ? depositInProgress.expected : 0;
      if(expected && expected > 0 && Math.abs(amount - expected) > 0.01){
        logBot(`Inserted amount ${formatCurrency(amount)} does not match expected ${formatCurrency(expected)}. Please cancel and try again.`);
        speak('Inserted amount does not match expected. Please cancel and try again.');
        resetCountingUI();
        depositInProgress = null;
        return;
      }
      
      // Call API to process deposit
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/account/deposit', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ amount: amount, description: 'ATM deposit' })
        });

        if (response.ok) {
          const data = await response.json();
          balance = parseFloat(data.newBalance) || balance + amount;
          updateBalanceUI();
          logBot(`Deposit accepted. ${formatCurrency(amount)} added to your account.`);
          speak('Deposit accepted. Thank you.');
          showSuccessBanner('Deposit successful — ' + formatCurrency(amount));
          // cleanup UI
          resetCountingUI();
          depositInProgress = null;
          // return to main after short delay
          setTimeout(()=>{ showPage('main'); }, 1200);
        } else {
          const error = await response.json();
          logBot(`Error: ${error.error || 'Deposit failed'}`);
          speak('Transaction failed. Please try again.');
          resetCountingUI();
          depositInProgress = null;
        }
      } catch (error) {
        console.error('Deposit error:', error);
        logBot('Network error. Please try again.');
        speak('Network error. Please try again.');
        resetCountingUI();
        depositInProgress = null;
      }
    }

    if(startInsertBtn){ startInsertBtn.addEventListener('click', ()=>{
      const val = depositAmountEl ? parseFloat(depositAmountEl.value) : 0;
      startDeposit(val);
    }); }

    // allow deposit tile click
    document.querySelectorAll('#btnDeposit').forEach(el=> el.addEventListener('click', ()=> showPage('deposit')));

    // Speech-to-text

    function setupRecognition() {
      const SR =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;
      if (!SR) return null;
      const rec = new SR();
      rec.lang = speechLang(currentLang);
      rec.interimResults = false;
      rec.continuous = true;

      rec.onresult = (e) => {
        const txt =
          e.results[e.results.length - 1][0]
            .transcript;
        logUser("🎤 " + txt);
        handleCommand(txt);
      };

      rec.onend = () => {
        if (listeningActive) {
          try {
            rec.start();
          } catch {}
        }
      };

      return rec;
    }

    recognition = setupRecognition();

    function setMicUI(on) {
      if (!micToggleLabel) return;
      if (on) {
        micToggleLabel.classList.add("on");
      } else {
        micToggleLabel.classList.remove("on");
      }
    }

    function toggleListening(on) {
      if (!recognition) {
        logBot("Speech recognition not supported in this browser.");
        return;
      }
      listeningActive = on;
      setMicUI(on);
      if (on) {
        try {
          recognition.start();
        } catch {}
        speak(i18n[currentLang].listening_on);
      } else {
        try {
          recognition.stop();
        } catch {}
        speak(i18n[currentLang].listening_off);
      }
    }

    if (micToggle && micToggleLabel) {
      micToggleLabel.addEventListener("click", () => {
        micToggle.checked = !micToggle.checked;
        toggleListening(micToggle.checked);
      });
    }

    // Capture hardware/keyboard numeric presses when no input is focused
    (function registerKeypadListener() {
      document.addEventListener("keydown", (ev) => {
        // ignore when typing into inputs or selects
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.tagName === "SELECT")) return;
        const k = ev.key;
        if (!k) return;
        if (/^[0-9]$/.test(k)) {
          // treat single key as numeric selection for the current menu
          handleNumericSelection(k);
          ev.preventDefault();
        }
        if (k === "Escape") {
          goBack();
        }
        if (k === "*") {
          // optional future use
        }
      });
    })();

    // Language select

    if (langSelect) {
      langSelect.addEventListener("change", () =>
        switchLang(langSelect.value)
      );
    }
    if (langSelectTop) {
      langSelectTop.addEventListener("change", () =>
        switchLang(langSelectTop.value)
      );
    }

    // Activate & transfer

    const activateConfirm = document.getElementById(
      "activateConfirm"
    );
    if (activateConfirm) {
      activateConfirm.addEventListener("click", () => {
        const dict = i18n[currentLang];
        logBot(dict.activated);
        speak(dict.activated);
        showPage("main");
      });
    }

    const transferNext = document.getElementById(
      "transferNext"
    );
    if (transferNext) {
      transferNext.addEventListener("click", () => {
        console.log('transferNext clicked');
        const amount = document.getElementById('transferAmount')?.value;
        const toAccount = document.getElementById('transferToAccount')?.value;
        const payee = document.getElementById('transferPayee')?.value;
        
        console.log('Transfer form values:', { amount, toAccount, payee });
        
        if (!amount || parseFloat(amount) <= 0) {
          logBot('Please enter a valid amount');
          speak('Please enter a valid amount');
          return;
        }
        
        if (!toAccount) {
          logBot('Please enter recipient account number');
          speak('Please enter recipient account number');
          return;
        }
        
        // Populate confirmation page
        const confirmRecipient = document.getElementById('confirmRecipient');
        const confirmAmount = document.getElementById('confirmAmount');
        
        console.log('Confirmation elements:', { confirmRecipient, confirmAmount });
        
        if (confirmRecipient) {
          const recipientText = payee ? `${payee} (${toAccount})` : toAccount;
          confirmRecipient.textContent = recipientText;
          console.log('Set confirmRecipient to:', recipientText);
        }
        if (confirmAmount) {
          const amountText = formatCurrency(parseFloat(amount));
          confirmAmount.textContent = amountText;
          console.log('Set confirmAmount to:', amountText);
        }
        
        showPage("transferConfirm");
      });
    }

    const transferSend = document.getElementById(
      "transferSend"
    );
    if (transferSend) {
      transferSend.addEventListener("click", async () => {
        const amount = parseFloat(document.getElementById('transferAmount')?.value);
        const toAccountNumber = document.getElementById('transferToAccount')?.value;
        const payee = document.getElementById('transferPayee')?.value;
        const description = payee ? `Transfer to ${payee}` : 'Transfer';
        
        console.log('Transfer initiated:', { amount, toAccountNumber, description });
        
        if (!amount || amount <= 0) {
          logBot('Please enter a valid amount');
          speak('Please enter a valid amount');
          return;
        }
        
        if (!toAccountNumber) {
          logBot('Please enter recipient account number');
          speak('Please enter recipient account number');
          return;
        }
        
        try {
          const token = localStorage.getItem('token');
          console.log('Token found:', !!token);
          
          if (!token) {
            logBot('Session expired - please login again');
            return;
          }
          
          const response = await fetch('/account/transfer', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
              amount,
              toAccountNumber,
              description
            })
          });
          
          console.log('Transfer response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Transfer successful:', data);
            balance = data.newBalance;
            updateBalanceUI();
            
            const dict = i18n[currentLang];
            const successMsg = `Transfer successful! ${formatCurrency(amount)} sent to ${toAccountNumber}`;
            logBot(successMsg);
            speak(dict.transfer_done || 'Transfer completed');
            showSuccessBanner(successMsg);
            
            // Clear form
            document.getElementById('transferAmount').value = '';
            document.getElementById('transferToAccount').value = '';
            document.getElementById('transferPayee').value = '';
            if (document.getElementById('transferBank')) {
              document.getElementById('transferBank').value = '';
            }
            
            showPage("main");
          } else {
            const error = await response.json();
            console.error('Transfer failed:', error);
            logBot(error.error || 'Transfer failed');
            speak(error.error || 'Transfer failed');
          }
        } catch (error) {
          console.error('Transfer error:', error);
          logBot('Transfer failed - please try again');
          speak('Transfer failed');
        }
      });
    }

    // Init
  cachedVoices  
    applyI18n();
    updatePageVisibility();
    if (langSelect) langSelect.value = currentLang;
    if (langSelectTop) langSelectTop.value = currentLang;

  // Load user name and balance from API on page load
  loadUserName();
  loadBalance();

    logBot(
      'ATM ready.'
    );
    // visually flash main options so users notice available buttons after ready
    try{ flashAllOptions(); }catch(e){}
    // show numbered options for the main menu immediately
    try{ displayMenuOptions('main'); }catch(e){}
  });

const btnTransactions = document.getElementById("btnTransactions");
if (btnTransactions) {
  btnTransactions.addEventListener("click", () => {
    window.location.href = "transactions.html";
  });
}
