// Simple middleware to validate incoming recipient value in req.body
export default function validateRecipient(req, res, next) {
  const { value } = req.body || {};
  if (typeof value === 'undefined') return next(); // allow other flows to check
  if (!value || String(value).trim().length === 0) return res.status(400).json({ error: 'Value is required' });
  const normalized = String(value).replace(/\D+/g, '');
  if (!/^[0-9]+$/.test(normalized)) return res.status(400).json({ error: 'Value must contain digits' });
  // attach normalized for controllers
  req.body.normalizedValue = normalized;
  next();
}
