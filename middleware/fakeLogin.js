// middleware/fakeLogin.js
export default function fakeLogin(req, res, next) {
  // Debug — remove in production
  console.log("fakeLogin: authorization =", req.headers.authorization);
  console.log("fakeLogin: cookie =", req.headers.cookie);

  // If a real user/session already exists, continue
  if (req.user) return next();

  // Allow a DEV override to always set a user (optional)
  if (process.env.DEV_ALLOW_ALL === "true") {
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