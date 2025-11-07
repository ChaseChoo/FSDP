// -----------------------------
// STATE & ELEMENTS
// -----------------------------
const pages = {
  main: document.getElementById("mainMenu"),
  cash: document.getElementById("cashPage"),
  noncash: document.getElementById("nonCashPage"),
  balance: document.getElementById("balancePage"),
  activate: document.getElementById("activatePage"),
  transfer: document.getElementById("transferPage"),
  transferConfirm: document.getElementById("transferConfirmPage"),
};

const chatlog   = document.getElementById("chatlog");
const userInput = document.getElementById("userInput");
const langSelect = document.getElementById("langSelect");
const langSelectTop = document.getElementById("langSelectTop");
const micToggle = document.getElementById("micToggle");
const micToggleLabel = document.getElementById("micToggleLabel");

let currentLang = "en";
let balance = 1240.00;
let selectedCashAmount = null;
let navHistory = ["main"];

let recognition;
let listeningActive = false;
let hoverReadCooldown = false;

// -----------------------------
// I18N (EN, ZH, MS, TA)
// -----------------------------
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
    withdrawn_now: (amt)=>`Withdrew ${formatCurrency(amt)}. ${i18n.en.current_balance}: ${formatCurrency(balance)}.`,
    balance_is: (amt)=>`Your balance is ${formatCurrency(amt)}.`,
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
    withdrawn_now: (amt)=>`已取出 ${formatCurrency(amt)}。${i18n.zh.current_balance}: ${formatCurrency(balance)}。`,
    balance_is: (amt)=>`您的余额是 ${formatCurrency(amt)}。`,
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
    withdrawn_now: (amt)=>`Dikeluarkan ${formatCurrency(amt)}. ${i18n.ms.current_balance}: ${formatCurrency(balance)}.`,
    balance_is: (amt)=>`Baki anda ialah ${formatCurrency(amt)}.`,
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
    payment_mode: "கட்டண விதம்",
    non_immediate: "உடனடி அல்லாத பரிமாற்றம்",
    immediate: "உடனடி பரிமாற்றம்",
    transfer_confirm: "பரிமாற்ற உறுதிப்பு",
    send: "அனுப்பு",
    listening_on: "கேட்டு கொண்டிருக்கிறது",
    listening_off: "மைக்கிரோஃபோன் ஆஃப்",
    switched: "மாற்றப்பட்டது",
    withdraw_msg: "சரி! பணம் வழங்கப்பட்டது.",
    need_amount: "தொகையை தேர்ந்தெடுக்கவும் அல்லது உள்ளிடவும்.",
    insufficient: "போதுமான இருப்பு இல்லை.",
    activated: "அருமை! உங்கள் அட்டை செயற்படுத்தப்பட்டது.",
    transfer_done: "முடிந்தது! பரிமாற்றம் நிறைவு.",
    not_understood: "மன்னிக்கவும், புரியவில்லை. மீண்டும் சொல்வீர்களா?",
    withdrawn_now: (amt)=>`${formatCurrency(amt)} வழங்கப்பட்டது. ${i18n.ta.current_balance}: ${formatCurrency(balance)}.`,
    balance_is: (amt)=>`உங்கள் இருப்பு ${formatCurrency(amt)}.`,
  }
};

function applyI18n() {
  const dict = i18n[currentLang];
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    if (dict[key]) el.textContent = dict[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) el.setAttribute("placeholder", dict[key]);
  });
  document.querySelector(".atm-title").textContent = dict.hello;
  document.querySelector(".atm-subtitle").textContent = dict.what_do;

  // Update transfer mode option labels
  const tfMode = document.getElementById("tfMode");
  if (tfMode){
    tfMode.options[0].textContent = dict.non_immediate;
    tfMode.options[1].textContent = dict.immediate;
  }

  // Update mic labels
  const onLabel = document.querySelector(".label-on");
  const offLabel = document.querySelector(".label-off");
  if (onLabel) onLabel.textContent = dict.listening_on;
  if (offLabel) offLabel.textContent = dict.listening_off;

  updateBalanceUI();
}

function switchLang(newLang){
  currentLang = newLang;
  if (langSelect) langSelect.value = newLang;
  if (langSelectTop) langSelectTop.value = newLang;
  applyI18n();
  logBot(`${i18n[currentLang].switched} ${langName(newLang)}.`);
  speak(`${i18n[currentLang].switched} ${langName(newLang)}.`);
  // update ASR language live
  if (recognition) recognition.lang = speechLang(newLang);
}

function langName(code){
  return {en:"English", zh:"中文", ms:"Bahasa Melayu", ta:"தமிழ்"}[code] || code;
}
function speechLang(code){
  return {en:"en-US", zh:"zh-CN", ms:"ms-MY", ta:"ta-IN"}[code] || "en-US";
}

// -----------------------------
// NAVIGATION + UI
// -----------------------------
function showPage(name){
  Object.values(pages).forEach(p=>p.classList.remove("active"));
  const el = pages[name]; if (!el) return;
  el.classList.add("active");
  navHistory.push(name);
  logBot(`${i18n[currentLang].switched} ${name} page.`);
}
function goBack(){
  if (navHistory.length > 1) navHistory.pop(); // current
  const prev = navHistory.pop() || "main";
  showPage(prev || "main");
}
document.querySelectorAll(".backBtn").forEach(b=>b.addEventListener("click", goBack));
document.getElementById("exitBtn").onclick = ()=>{
  selectedCashAmount = null;
  document.querySelectorAll(".denom").forEach(b=>b.classList.remove("selected"));
  const other = document.getElementById("cashOther"); if (other) other.value = "";
  navHistory = ["main"];
  showPage("main");
};
document.getElementById("btnCash").onclick = ()=> showPage("cash");
document.getElementById("btnNonCash").onclick = ()=> showPage("noncash");
document.getElementById("btnBalance").onclick = ()=>{ updateBalanceUI(); showPage("balance"); };
document.getElementById("btnActivateCard").onclick = ()=> showPage("activate");
document.getElementById("btnTransfer").onclick = ()=> showPage("transfer");
["btnBill","btnCPF","btnInvest"].forEach(id=>{
  const el = document.getElementById(id);
  el && (el.onclick = ()=> logBot(`${document.getElementById(id).textContent} – (demo) coming soon.`));
});

// Add obvious external links: if user wants to open full pages (login/account/transactions)
// map some actions to existing static pages in /public for convenience
function linkToStatic(id, href){
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('click', ()=> { window.location.href = href; });
}
// Example: make a long-press or ctrl-click open the dedicated account page
linkToStatic('btnBalance', 'account.html');

// -----------------------------
// CASH PAGE (buttons still work)
// -----------------------------
const denomButtons = Array.from(document.querySelectorAll(".denom"));
denomButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    denomButtons.forEach(b=>b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedCashAmount = parseFloat(btn.dataset.amount);
  });
});
const cashOtherSet = document.getElementById("cashOtherSet");
if (cashOtherSet) cashOtherSet.onclick = ()=>{
  const val = parseFloat(document.getElementById("cashOther").value || "0");
  if (val > 0){
    denomButtons.forEach(b=>b.classList.remove("selected"));
    selectedCashAmount = val;
    logBot(`S$${val.toFixed(2)} set.`);
  }
};
const cashConfirm = document.getElementById("cashConfirm");
if (cashConfirm) cashConfirm.onclick = ()=> immediateWithdraw(selectedCashAmount);

// -----------------------------
// ASSISTANT + COMMANDS
// -----------------------------
function logBot(text){
  if (!chatlog) return;
  chatlog.innerHTML += `<div>🤖 ${text}</div>`;
  chatlog.scrollTop = chatlog.scrollHeight;
}
function logUser(text){
  if (!chatlog) return;
  chatlog.innerHTML += `<div>🧍 ${text}</div>`;
  chatlog.scrollTop = chatlog.scrollHeight;
}
function formatCurrency(n){ return `S$${(n||0).toFixed(2)}`; }
function updateBalanceUI(){
  const el = document.getElementById("balanceValue");
  if (el) el.textContent = formatCurrency(balance);
}
function immediateWithdraw(amount){
  const dict = i18n[currentLang];
  const amt = parseFloat(amount || 0);
  if (!amt || amt <= 0){
    logBot(dict.need_amount); speak(dict.need_amount); return;
  }
  if (balance < amt){
    logBot(`${dict.insufficient} (${formatCurrency(balance)})`); speak(dict.insufficient); return;
  }
  balance -= amt;
  updateBalanceUI();
  logBot(dict.withdrawn_now(amt));
  speak(dict.withdraw_msg); // warm tone TTS
  showPage("main");
}

function handleCommand(raw){
  const text = (raw||"").trim();
  if (!text){ return; }
  const lower = text.toLowerCase();

  const numMatch = text.replace(/,/g,"").match(/(\d+(\.\d+)?)/);
  const amount = numMatch ? parseFloat(numMatch[1]) : null;

  const intents = {
    withdraw: /(withdraw|get cash|取现|提取|提款|keluar|pengeluaran|tarik|wang|பணம் எடு|எடு|வெளியேற்று)/i,
    balance: /(balance|余额|baki|இருப்பு|semakan baki|check balance)/i,
    transfer: /(transfer|转账|汇款|pindah|pindahan|பரிமாற்றம்)/i,
    activate: /(activate|激活|aktif|aktifkan|செயற்படுத்து)/i,
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

  if (intents.withdraw.test(lower)){
    if (amount){ return immediateWithdraw(amount); }
    showPage("cash");
    logBot(i18n[currentLang].need_amount);
    speak(i18n[currentLang].need_amount);
    return;
  }
  if (intents.balance.test(lower)){
    logBot(i18n[currentLang].balance_is(balance));
    speak(i18n[currentLang].balance_is(balance));
    updateBalanceUI();
    showPage("balance");
    return;
  }
  if (intents.transfer.test(lower)){
    showPage("transfer");
    logBot(i18n[currentLang].switched + " Transfer.");
    return;
  }
  if (intents.activate.test(lower)){
    showPage("activate");
    return;
  }
  if (intents.menu.test(lower)){
    showPage("main");
    return;
  }

  logBot(i18n[currentLang].not_understood);
  speak(i18n[currentLang].not_understood);
}

// Text input
document.getElementById("sendBtn").onclick = ()=>{
  const text = userInput.value.trim();
  if (!text) return;
  logUser(text);
  handleCommand(text);
  userInput.value="";
};

// -----------------------------
// TTS (Friendly & warm voice)
// -----------------------------
let cachedVoices = [];
function loadVoices(){
  cachedVoices = window.speechSynthesis.getVoices();
}
window.speechSynthesis.onvoiceschanged = loadVoices; loadVoices();

function pickVoice(langCode){
  const prefer = {
    en: [/Google UK English Female/i, /Samantha/i, /Microsoft.*Aria/i, /^en/i],
    zh: [/Google 中文|Google.*Chinese|Ting-Ting|Li-mu|Mei-Jia/i, /^zh/i, /cmn/i],
    ms: [/Malay/i, /^ms/i],
    ta: [/Tamil/i, /^ta/i]
  }[langCode] || [];

  for (const pat of prefer){
    const found = cachedVoices.find(v=> pat.test(v.name) || pat.test(v.lang));
    if (found) return found;
  }
  const fallback = cachedVoices.find(v=> v.lang && v.lang.toLowerCase().startsWith(langCode));
  return fallback || cachedVoices[0] || null;
}

function speak(text){
  if (!text) return;
  const synth = window.speechSynthesis;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = speechLang(currentLang);
  const v = pickVoice(currentLang);
  if (v) utter.voice = v;
  utter.rate = 1.0;
  utter.pitch = 1.1;
  utter.volume = 1.0;
  synth.cancel();
  synth.speak(utter);
}

// -----------------------------
// Hover-to-speak (all buttons)
// -----------------------------
function readElementLabel(el){
  let text = el.getAttribute("data-i18n") ? i18n[currentLang][el.getAttribute("data-i18n")] : el.textContent.trim();
  if (!text) return;
  if (hoverReadCooldown) return;
  hoverReadCooldown = true;
  speak(text);
  setTimeout(()=> hoverReadCooldown = false, 600);
}

function registerHoverTTS(){
  const btns = document.querySelectorAll("button, .tile, .denom, .link-btn, .cta, .ghost, .backBtn");
  btns.forEach(btn=>{
    btn.addEventListener("mouseenter", ()=> readElementLabel(btn));
  });
}
registerHoverTTS();

// -----------------------------
// Continuous Speech-to-Text (Mic switch)
// -----------------------------
function setupRecognition(){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = speechLang(currentLang);
  rec.interimResults = false;
  rec.continuous = true; // continuous mode
  rec.maxAlternatives = 1;

  rec.onresult = (e)=>{
    const txt = e.results[e.results.length-1][0].transcript;
    logUser(`🎤 ${txt}`);
    handleCommand(txt);
  };
  rec.onend = ()=>{
    if (listeningActive){
      try { rec.start(); } catch {}
    }
  };
  return rec;
}
recognition = setupRecognition();

function toggleListening(on){
  if (!recognition){
    logBot('Speech recognition not supported in this browser.');
    return;
  }
  listeningActive = on;
  if (on){
    try { recognition.start(); } catch {}
    micToggle.checked = true;
    micToggleLabel.classList.add("active");
    speak(i18n[currentLang].listening_on);
  } else {
    try { recognition.stop(); } catch {}
    micToggle.checked = false;
    micToggleLabel.classList.remove("active");
    speak(i18n[currentLang].listening_off);
  }
}
micToggle.addEventListener("change", e=> toggleListening(e.target.checked));

micToggleLabel.addEventListener("click", (e)=>{
  if (e.target.tagName.toLowerCase() === "input") return;
  micToggle.checked = !micToggle.checked;
  toggleListening(micToggle.checked);
});

// -----------------------------
// Language controls
// -----------------------------
if (langSelect) langSelect.onchange    = ()=> switchLang(langSelect.value);
if (langSelectTop) langSelectTop.onchange = ()=> switchLang(langSelectTop.value);

// -----------------------------
// INIT
// -----------------------------
applyI18n();
if (langSelect) langSelect.value = currentLang;
if (langSelectTop) langSelectTop.value = currentLang;
logBot("ATM ready. Try saying: “withdraw 50 dollars / 取现 50 / keluarkan 50 / 50 பணம் எடு”.");
