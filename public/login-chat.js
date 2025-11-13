// login-chat.js
// Simple chat assistant for login help: NRIC/email/phone + OTP + change PIN flow
(() => {
  const chatRoot = document.getElementById('login-chat');
  const toggle = document.getElementById('chatToggle');
  const logEl = document.getElementById('loginChatLog');
  const input = document.getElementById('loginChatInput');
  const send = document.getElementById('loginChatSend');

  if (!chatRoot || !toggle || !logEl || !input || !send) return;

  let state = { step: 'idle', identifier: null, tempToken: null };
  let ttsEnabled = true;
  let currentLang = 'en';
  let cachedVoices = [];

  const i18n = {
    en: {
      welcome: 'Hello — I can help with PIN resets and access codes. Type "forgot pin" to begin.',
      ask_identifier: 'Please enter your NRIC / registered email or phone number so I can send an OTP.',
      otp_sent: 'An OTP has been sent. Please enter the 6-digit code you received.',
      ask_newpin: 'Enter your new PIN (4-6 digits).',
      reset_intro: 'I can help you reset your PIN. We will verify your identity using an OTP.',
      access_intro: 'I can help generate an access code for your banking app. I will need your NRIC / registered email or phone to proceed.',
      not_understood: 'Sorry, I did not understand. Try: "forgot pin" or "access code".',
      lookup_account: 'Looking up your account...',
      otp_generated: 'OTP generated.',
      otp_verify_failed: 'OTP verification failed.',
      otp_verified: 'OTP verified. You may now set a new PIN.',
      pin_changed: 'Your PIN has been changed successfully. You can now login with the new PIN.',
      pin_invalid: 'PIN must be 4 to 6 digits. Try again.',
      network_error: 'Network error. Try again later.'
    },
    zh: {
      welcome: '您好 — 我可以协助重置 PIN 及生成访问码。输入 "forgot pin" 开始。',
      ask_identifier: '请输入您的 NRIC / 注册邮箱或手机号，以便我发送验证码。',
      otp_sent: '验证码已发送，请输入您收到的6位数验证码。',
      ask_newpin: '请输入新的 PIN（4-6 位数字）。',
      reset_intro: '我可以帮助您重置 PIN 。我们会使用验证码验证您的身份。',
      access_intro: '我可以为您的银行应用生成访问码。请提供 NRIC / 注册邮箱或手机号。',
      not_understood: '抱歉，我无法理解。试试输入："forgot pin" 或 "access code"。',
      lookup_account: '正在查找您的账户...',
      otp_generated: '已生成验证码。',
      otp_verify_failed: '验证码校验失败。',
      otp_verified: '验证码验证成功。现在可以设置新的 PIN。',
      pin_changed: '您的 PIN 已成功更改。',
      pin_invalid: 'PIN 必须为 4 到 6 位数字，请重试。',
      network_error: '网络错误，请稍后再试。'
    },
    ms: {
      welcome: 'Hai — Saya boleh membantu menetapkan semula PIN dan kod akses. Taip "forgot pin" untuk mula.',
      ask_identifier: 'Sila masukkan NRIC / emel atau nombor telefon berdaftar supaya saya boleh menghantar OTP.',
      otp_sent: 'OTP telah dihantar. Sila masukkan kod 6 digit yang anda terima.',
      ask_newpin: 'Masukkan PIN baru anda (4-6 digit).',
      reset_intro: 'Saya boleh membantu menetapkan semula PIN anda. Kami akan mengesahkan identiti anda menggunakan OTP.',
      access_intro: 'Saya boleh membantu menghasilkan kod akses untuk aplikasi bank anda. Saya perlukan NRIC / emel atau telefon anda.',
      not_understood: 'Maaf, saya tidak faham. Cuba: "forgot pin" atau "access code".',
      lookup_account: 'Mencari akaun anda...',
      otp_generated: 'OTP dijana.',
      otp_verify_failed: 'Pengesahan OTP gagal.',
      otp_verified: 'OTP disahkan. Sila tetapkan PIN baru.',
      pin_changed: 'PIN anda telah berjaya ditukar.',
      pin_invalid: 'PIN mesti 4 hingga 6 digit. Cuba lagi.',
      network_error: 'Ralat rangkaian. Cuba lagi kemudian.'
    },
    ta: {
      welcome: 'வணக்கம் — நான் PIN மாற்றத்தையும் அணுகல் குறியீட்டை உருவாக்க உதவுவேன். "forgot pin" என்று தட்டவும்.',
      ask_identifier: 'உங்கள் NRIC / பதிவு செய்யப்பட்ட மின்னஞ்சல் அல்லது தொலைபேசி எண்ணை உள்ளிடவும், நான் OTP ஐ அனுப்ப உதவுகிறேன்.',
      otp_sent: 'OTP அனுப்பப்பட்டது. நீங்கள் பெற்ற 6 இலக்க குறியீட்டைப் பதிவு செய்யவும்.',
      ask_newpin: 'உங்கள் புதிய PIN ஐ உள்ளிடவும் (4-6 இலக்கங்கள்).',
      reset_intro: 'நான் உங்கள் PIN ஐ மீட்டமைக்க உதவலாம். நாங்கள் OTP மூலம் உங்கள் அடையாளத்தை உறுதிசெய்துகொள்வோம்.',
      access_intro: 'உங்கள் வங்கி செயலிக்கு அணுகல் குறியீட்டை உருவாக்க நான் உதவலாம். NRIC / பதிவு செய்யப்பட்ட மின்னஞ்சல் அல்லது தொலைபேசி தேவை.',
      not_understood: 'மன்னிக்கவும், புரியவில்லை. முயற்சிக்க: "forgot pin" அல்லது "access code".',
      lookup_account: 'உங்கள் கணக்கை ஒரு நொடியில் பார்க்கிறேன்...',
      otp_generated: 'OTP உருவாக்கப்பட்டது.',
      otp_verify_failed: 'OTP சரிபார்ப்பு தோல்வியடைந்தது.',
      otp_verified: 'OTP சரிபார்க்கப்பட்டது. இப்போது புதிய PIN ஐ அமைக்கலாம்.',
      pin_changed: 'உங்கள் PIN வெற்றிகரமாக மாற்றப்பட்டது.',
      pin_invalid: 'PIN 4 முதல் 6 இலக்கங்கள் இருக்க வேண்டும். மீண்டும் முயற்சி செய்க.'
    }
  };

  function speechLang(code) {
    return ({ en: 'en-US', zh: 'zh-CN', ms: 'ms-MY', ta: 'ta-IN' }[code] || 'en-US');
  }

  function loadVoices(){ if(!('speechSynthesis' in window)) return; cachedVoices = window.speechSynthesis.getVoices(); }
  if('speechSynthesis' in window){ window.speechSynthesis.onvoiceschanged = loadVoices; loadVoices(); }

  function pickVoice(langCode){ if(!cachedVoices || !cachedVoices.length) return null; const patterns = { en:[/English/i], zh:[/Chinese|zh/i], ms:[/Malay|ms/i], ta:[/Tamil|ta/i] }[langCode]||[]; for(const p of patterns){ const found = cachedVoices.find(v=>p.test(v.name)||p.test(v.lang)); if(found) return found; } return (cachedVoices.find(v=>v.lang.toLowerCase().startsWith(langCode))||cachedVoices[0]); }

  function speak(text){ if(!ttsEnabled || !text || !('speechSynthesis' in window)) return; const u = new SpeechSynthesisUtterance(text); u.lang = speechLang(currentLang); const v = pickVoice(currentLang); if(v) u.voice = v; u.rate = 1.0; u.pitch = 1.0; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); }

  function appendBot(text){
    const d = document.createElement('div'); d.className='bot'; d.textContent = '🤖 '+text; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; try{ speak(text); }catch(e){}
  }
  function appendUser(text){
    const d = document.createElement('div'); d.className='user'; d.textContent = text; logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight;
  }

  toggle.addEventListener('click', ()=>{
    chatRoot.classList.toggle('collapsed');
    const hidden = chatRoot.classList.contains('collapsed');
    chatRoot.setAttribute('aria-hidden', hidden ? 'true' : 'false');
    if(!hidden) input.focus();
  });

  // language & TTS controls
  const langSel = document.getElementById('chatLang');
  const ttsBtn = document.getElementById('chatTTS');
  if(langSel){ langSel.value = currentLang; langSel.addEventListener('change', ()=>{ currentLang = langSel.value; appendBot(i18n[currentLang].welcome); }); }
  if(ttsBtn){ ttsBtn.addEventListener('click', ()=>{ ttsEnabled = !ttsEnabled; ttsBtn.textContent = ttsEnabled ? '🔊' : '🔈'; }); ttsBtn.textContent = ttsEnabled ? '🔊' : '🔈'; }

  // simple intent detection
  function isForgotPin(text){ return /forgot.*pin|forgot.*pin number|forgot.*pin|reset pin/i.test(text); }
  function isAccessCode(text){ return /access code|app code|accesscode|activation code/i.test(text); }

  async function apiRequestOtp(identifier){
    try{
      const r = await fetch('/auth/request-otp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identifier})});
      return r.json();
    }catch(e){return { error: 'network' }}
  }

  async function apiVerifyOtp(identifier, otp){
    try{
      const r = await fetch('/auth/verify-otp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identifier, otp})});
      return r.json();
    }catch(e){return { error: 'network' }}
  }

  async function apiChangePassword(tempToken, newPassword){
    try{
      const r = await fetch('/auth/change-password',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tempToken, newPassword})});
      return r.json();
    }catch(e){return { error: 'network' }}
  }

  function promptForIdentifier(){
    appendBot(i18n[currentLang].ask_identifier);
    state.step = 'awaiting-identifier';
  }

  function promptForOtp(){
    appendBot(i18n[currentLang].otp_sent);
    state.step = 'awaiting-otp';
  }

  function promptForNewPin(){
    appendBot(i18n[currentLang].ask_newpin);
    state.step = 'awaiting-newpin';
  }

  // Process user input based on state
  send.addEventListener('click', onSend);
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') onSend(); });

  function onSend(){
    const txt = (input.value||'').trim(); if(!txt) return; input.value=''; appendUser(txt);

    if(state.step === 'idle'){
      if(isForgotPin(txt)){
        appendBot(i18n[currentLang].reset_intro);
        promptForIdentifier();
        return;
      }
      if(isAccessCode(txt)){
        appendBot(i18n[currentLang].access_intro);
        promptForIdentifier();
        return;
      }
      appendBot(i18n[currentLang].not_understood);
      return;
    }

    if(state.step === 'awaiting-identifier'){
      const identifier = txt;
      state.identifier = identifier;
      appendBot(i18n[currentLang].lookup_account);
      apiRequestOtp(identifier).then((res)=>{
        if(res && res.error){ appendBot('Could not generate OTP: '+(res.error||'unknown')); state.step='idle'; return; }
        appendBot(i18n[currentLang].otp_generated);
        // In dev mode the API returns the OTP for convenience
        if(res && res.otp) appendBot('(Demo) OTP: '+res.otp);
        promptForOtp();
      }).catch((e)=>{ appendBot('Network error while requesting OTP. Try again later.'); state.step='idle'; });
      return;
    }

    if(state.step === 'awaiting-otp'){
      const otp = txt.replace(/\s+/g,'');
      appendBot(i18n[currentLang].otp_verify_failed ? 'Verifying OTP...' : 'Verifying OTP...');
      apiVerifyOtp(state.identifier, otp).then((res)=>{
        if(res && res.error){ appendBot('OTP verification failed: '+(res.error||'invalid')); state.step='idle'; return; }
        if(res && res.tempToken){ state.tempToken = res.tempToken; appendBot('OTP verified. You may now set a new PIN.'); promptForNewPin(); return; }
        appendBot('Unexpected response from server.'); state.step='idle';
      }).catch(()=>{ appendBot('Network error while verifying OTP.'); state.step='idle'; });
      return;
    }

    if(state.step === 'awaiting-newpin'){
      const pin = txt.trim();
      if(!/^\d{4,6}$/.test(pin)){ appendBot(i18n[currentLang].pin_invalid); return; }
      appendBot('Updating your PIN...');
      apiChangePassword(state.tempToken, pin).then((res)=>{
        if(res && res.error){ appendBot('Failed to change PIN: '+(res.error||'unknown')); state.step='idle'; return; }
        appendBot(i18n[currentLang].pin_changed);
        state = { step: 'idle', identifier: null, tempToken: null };
      }).catch(()=>{ appendBot('Network error while changing PIN.'); state.step='idle'; });
      return;
    }

    // fallback
    appendBot('I did not understand that.');
  }

  // seed welcome message
  appendBot('Hello — I can help with PIN resets and access codes. Type "forgot pin" to begin.');
})();
