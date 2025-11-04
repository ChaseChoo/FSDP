function checkHighRiskTransaction(method, recipient, amount, purpose) {
  let riskScore = 0;

  if (Number(amount) >= 1000) riskScore += 2;
  if (!approvedRecipients.some(r => r.value === recipient)) riskScore += 2;
  if (purpose.toLowerCase().includes("secure") || purpose.toLowerCase().includes("refund") || purpose.toLowerCase().includes("loan")) riskScore += 3;

  // Simulate time-based risk
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 5) riskScore += 1;

  return riskScore;
}

document.querySelector("form")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const method = document.getElementById("method").value;
  const recipient = document.getElementById("recipient").value;
  const amount = document.getElementById("amount").value;
  const purpose = document.getElementById("purpose").value;

  const risk = checkHighRiskTransaction(method, recipient, amount, purpose);

  if (risk >= 3) {
    alert("⚠️ Warning: This transaction looks unusual and may be a scam.\nPlease verify the recipient or contact your bank for help.");
    ttsSpeak("Warning. This transaction looks unusual and may be a scam. Please check before sending.");
  }

  // Save and redirect as before
  localStorage.setItem("paynow_method", method);
  localStorage.setItem("paynow_recipient", recipient);
  localStorage.setItem("paynow_amount", amount);
  localStorage.setItem("paynow_purpose", purpose);

  window.location.href = "confirm-paynow.html";
});
