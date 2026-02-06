// middleware/fakeLogin.js
export default function fakeLogin(req, res, next) {
  // Debug — remove in production
  console.log(`[fakeLogin] ${req.method} ${req.path}`);
  
  // Allow public endpoints that don't require authentication
  // These are ATM public endpoints for guardian QR transactions
  if (req.path.startsWith('/api/guardian/execute-action') || 
      req.path.startsWith('/api/guardian/validate-action')) {
    console.log(`[fakeLogin] ✅ PUBLIC GUARDIAN ENDPOINT detected: ${req.method} ${req.path}`);
    req.user = { externalId: "PUBLIC_ATM", id: "public-atm", username: "atm" };
    return next();
  }

  // If a real user/session already exists, continue
  if (req.user) return next();

  // Allow a DEV override to always set a user (optional)
  // BUT: if there's a real JWT token, let requireSession handle it instead
  if (process.env.DEV_ALLOW_ALL === "true") {
    const auth = req.headers.authorization || "";
    // If there's a Bearer token that's NOT the fake dev token, skip fakeLogin
    if (auth.startsWith("Bearer ")) {
      const token = auth.slice(7);
      const devToken = process.env.FAKE_TOKEN || "FAKE_JWT_TOKEN";
      if (token !== devToken) {
        // Real JWT token present, let requireSession decode it
        console.log("fakeLogin: real JWT detected, passing to requireSession");
        return next();
      }
    }
    req.user = { externalId: "FAKE_USER", id: "dev-user", username: "dev" };
    return next();
  }

  // Accept a development fake token sent in the Authorization header
  const auth = req.headers.authorization || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7);
    const devToken = process.env.FAKE_TOKEN || "FAKE_JWT_TOKEN";
    if (token === devToken) {
      req.user = { externalId: "FAKE_USER", id: "dev-user", username: "dev" };
      console.log("fakeLogin: accepted fake token, req.user set");
      return next();
    }
  }

  // Not authenticated
  console.log("fakeLogin: unauthorized");
  res.status(401).json({ error: "Unauthorized" });
}