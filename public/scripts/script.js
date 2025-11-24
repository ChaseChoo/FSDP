const API_URL = "/account";

// Simulate JWT login - only set if no token exists
const fakeToken = "FAKE_JWT_TOKEN";
if (!localStorage.getItem("token")) {
  localStorage.setItem("token", fakeToken);
}

async function getBalance() {
  const res = await fetch(`${API_URL}/balance`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  if (!res.ok) {
    console.error("Balance fetch failed", res.status);
    return;
  }
  const data = await res.json();
  document.getElementById("balance").textContent = data.balance;
}

async function deposit() {
  const amount = Number(document.getElementById("amount").value);
  console.log("Depositing", amount);
  const res = await fetch(`${API_URL}/deposit`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ amount })
  });
  const data = await res.json();
  console.log("Deposit response:", data);
  await getBalance();
}

async function withdraw() {
  const amount = Number(document.getElementById("amount").value);
  const res = await fetch(`${API_URL}/withdraw`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ amount })
  });
  if (!res.ok) console.error("Withdraw failed", res.status);
  await getBalance();
}

async function getTransactions() {
  const res = await fetch(`/api/transactions`, {
    credentials: "include",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  if (!res.ok) {
    console.error("Transactions fetch failed", res.status);
    return;
  }
  const text = await res.text();
  console.log("Response body:", text);
  const data = JSON.parse(text);
  const tableBody = document.querySelector("#transactionTable tbody");
  tableBody.innerHTML = "";
  data.transactions.forEach(t => {
    tableBody.innerHTML += `
      <tr>
        <td>${new Date(t.CreatedAt).toLocaleString()}</td>
        <td>${t.Type}</td>
        <td>$${t.Amount}</td>
      </tr>`;
  });
}

// Initialize page
if (window.location.pathname === "/account" || window.location.pathname === "/account.html") getBalance();
if (window.location.pathname === "/transactions" || window.location.pathname === "/transactions.html") getTransactions();