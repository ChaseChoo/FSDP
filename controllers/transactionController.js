import { findUserByExternalId } from "../models/userModel.js";
import { getTransactionsForAccount } from "../models/transactionModel.js";
import { getDevTransactions } from "./accountController.js";

export async function getTransactionHistory(req, res) {
  console.log("getTransactionHistory: START, externalId =", req.user?.externalId);
  const externalId = req.user.externalId;
  try {
    // DEV shortcut: return actual dev transactions
    if (process.env.DEV_ALLOW_ALL === "true") {
      const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
      const page = Math.max(parseInt(req.query.page || "1", 10), 1);
      const offset = (page - 1) * limit;
      const txs = getDevTransactions(externalId, limit, offset);
      console.log("getTransactionHistory: returning", txs.length, "dev transactions");
      return res.json({ transactions: txs, page, limit });
    }

    console.log("getTransactionHistory: finding user...");
    const user = await findUserByExternalId(externalId);
    console.log("getTransactionHistory: user =", user);
    if (!user) {
      console.log("getTransactionHistory: user not found");
      return res.status(404).json({ error: "User not found" });
    }

    // read query params for pagination
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const offset = (page - 1) * limit;

    // find the account
    console.log("getTransactionHistory: finding account for userId =", user.Id);
    const accountModel = await import("../models/accountModel.js");
    const acc = await accountModel.findAccountByUserId(user.Id);
    console.log("getTransactionHistory: account =", acc);
    if (!acc) {
      console.log("getTransactionHistory: account not found, returning empty array");
      return res.json({ transactions: [] });
    }

    console.log("getTransactionHistory: fetching transactions for accountId =", acc.Id);
    const txs = await getTransactionsForAccount(acc.Id, limit, offset);
    console.log("getTransactionHistory: found", txs?.length || 0, "transactions");
    return res.json({ transactions: txs, page, limit });
  } catch (err) {
    console.error("getTransactionHistory: ERROR", err);
    return res.status(500).json({ error: "Server error fetching transactions" });
  }
}