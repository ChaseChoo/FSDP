document.addEventListener("DOMContentLoaded", () => {
  // Icons
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { "stroke-width": 1.5 } });
  }

  // Elements
  const pages = {
    main: document.getElementById("mainMenu"),
    cash: document.getElementById("cashPage"),
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

  const tfMode = document.getElementById("tfMode");

  // State
  let currentLang = "en";
  let balance = 1240.0;
  let selectedCashAmount = null;
  let navHistory = ["main"];
  let recognition = null;
  let listeningActive = false;
  let hoverReadCooldown = false;
  let cachedVoices = [];
let tempOtpToken = null;
let lastOtpIdentifier = null;

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
      el.addEventListener("click", () => showPage("transfer"))
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

  function immediateWithdraw(amount) {
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

    balance -= amt;
    updateBalanceUI();
    logBot(dict.withdrawn_now(amt, balance));
    speak(dict.withdraw_msg);
    showPage("main");
  }

  // Handle commands from input / voice

  function handleCommand(raw) {
    const text = (raw || "").trim();
    if (!text) return;
    const lower = text.toLowerCase();

    const numMatch = text.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
    const amount = numMatch ? parseFloat(numMatch[1]) : null;

    const intents = {
      withdraw:
        /(withdraw|get cash|取现|提取|提款|keluar|pengeluaran|tarik|wang|பணம் எடு|எடு|வெளியேற்று)/i,
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
      if (amount) return immediateWithdraw(amount);
      showPage("cash");
      logBot(i18n[currentLang].need_amount);
      speak(i18n[currentLang].need_amount);
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
    transferNext.addEventListener("click", () =>
      showPage("transferConfirm")
    );
  }

  const transferSend = document.getElementById(
    "transferSend"
  );
  if (transferSend) {
    transferSend.addEventListener("click", () => {
      const dict = i18n[currentLang];
      logBot(dict.transfer_done);
      speak(dict.transfer_done);
      showPage("main");
    });
  }

  // Init

  applyI18n();
  updatePageVisibility();
  if (langSelect) langSelect.value = currentLang;
  if (langSelectTop) langSelectTop.value = currentLang;

  logBot(
    'ATM ready. Try: "withdraw 50 dollars" / "取现 50" / "keluarkan 50" / "50 பணம் எடு".'
  );
});
