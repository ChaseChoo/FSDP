import { getApprovedRecipientsByExternalId, createApprovedRecipient, updateApprovedRecipient, deleteApprovedRecipient, getApprovedRecipientById } from "../models/approvedRecipientModel.js";

// Controller: expects requireSession middleware to attach req.user.externalId

export async function listApprovedRecipients(req, res) {
  try {
    const externalId = req.user?.externalId || null;
    if (!externalId) return res.status(401).json({ error: 'Missing user session' });
    const list = await getApprovedRecipientsByExternalId(externalId);
    return res.json({ approvedRecipients: list });
  } catch (err) {
    console.error('listApprovedRecipients ERROR', err);
    return res.status(500).json({ error: 'Server error listing approved recipients' });
  }
}

export async function createApproved(req, res) {
  try {
    const externalId = req.user?.externalId || null;
    if (!externalId) return res.status(401).json({ error: 'Missing user session' });
    const { value, normalizedValue } = req.body || {};
    const rawVal = normalizedValue || value;
    if (!rawVal) return res.status(400).json({ error: 'Value is required' });
    // server-side normalize: keep digits only
    const normalized = String(rawVal).replace(/\D+/g, '');
    const created = await createApprovedRecipient(externalId, '', normalized);
    return res.status(201).json({ approvedRecipient: created });
  } catch (err) {
    console.error('createApproved ERROR', err);
    return res.status(500).json({ error: 'Server error creating approved recipient' });
  }
}

export async function updateApproved(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const existing = await getApprovedRecipientById(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const externalId = req.user?.externalId || null;
    if (!externalId || existing.ExternalId !== externalId) return res.status(403).json({ error: 'Forbidden' });
    const { value, normalizedValue } = req.body || {};
    const rawVal = typeof normalizedValue !== 'undefined' ? normalizedValue : (typeof value !== 'undefined' ? value : existing.Value);
    const normalized = rawVal ? String(rawVal).replace(/\D+/g, '') : existing.Value;
    const updated = await updateApprovedRecipient(id, existing.Label || '', normalized);
    return res.json({ approvedRecipient: updated });
  } catch (err) {
    console.error('updateApproved ERROR', err);
    return res.status(500).json({ error: 'Server error updating approved recipient' });
  }
}

export async function removeApproved(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    const existing = await getApprovedRecipientById(id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const externalId = req.user?.externalId || null;
    if (!externalId || existing.ExternalId !== externalId) return res.status(403).json({ error: 'Forbidden' });
    const ok = await deleteApprovedRecipient(id);
    return res.json({ success: !!ok });
  } catch (err) {
    console.error('removeApproved ERROR', err);
    return res.status(500).json({ error: 'Server error deleting approved recipient' });
  }
}
