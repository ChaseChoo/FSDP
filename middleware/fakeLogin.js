// middleware/fakeLogin.js
export default function fakeLogin(req, res, next) {
  req.user = { externalId: "FAKE_USER" };
  next();
}