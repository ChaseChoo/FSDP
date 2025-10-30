// controllers/transactionController.js
import { findUserByExternalId } from "../models/userModel.js";
import { getTransactionsForAccount } from "../models/transactionModel.js";

export async function getTransactionHistory(req, res) {
  const externalId = req.user.externalId;
  try {
    const user = await findUserByExternalId(externalId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // read query params for pagination
    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const offset = (page - 1) * limit;

    // find the account
    // lightweight query to get account id
    const acc = await (await import("../models/accountModel.js")).findAccountByUserId(user.Id);
    if (!acc) return res.json({ transactions: [] });

    const txs = await getTransactionsForAccount(acc.Id, limit, offset);
    return res.json({ transactions: txs, page, limit });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error fetching transactions" });
  }
}
