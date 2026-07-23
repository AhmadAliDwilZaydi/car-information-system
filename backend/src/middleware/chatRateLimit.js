const { StatusCodes } = require("http-status-codes");

const requests = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 12;

function chatRateLimit(req, res, next) {
  const key = req.ip || "unknown";
  const now = Date.now();
  const timestamps = (requests.get(key) || []).filter((time) => now - time < WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS) {
    return res.status(StatusCodes.TOO_MANY_REQUESTS).json({ message: "Terlalu banyak permintaan chat. Coba lagi dalam satu menit." });
  }
  timestamps.push(now);
  requests.set(key, timestamps);
  return next();
}

module.exports = { chatRateLimit };
