const API_URL = "http://localhost:3000/account";

// Simulate JWT login
const fakeToken = "FAKE_JWT_TOKEN";
localStorage.setItem("token", fakeToken);

async function getBalance() {
  const res = await fetch(`${API_URL}/balance`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  const data = await res.json();
  document.getElementById("balance").textContent = data.balance;
}

async function deposit() {
  const amount = document.getElementById("amount").value;
  console.log("Depositing", amount);
  const res = await fetch(`${API_URL}/deposit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ amount })
  });
  const data = await res.json();
  console.log("Deposit response:", data);
  getBalance();
}

async function withdraw() {
  const amount = document.getElementById("amount").value;
  await fetch(`${API_URL}/withdraw`, {  // remove extra /account
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify({ amount })
  });
  getBalance();
}

async function getTransactions() {
  const res = await fetch(`${API_URL}/transactions`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
  });
  const data = await res.json();
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
if (window.location.pathname === "/account") getBalance();
if (window.location.pathname === "/transactions") getTransactions();