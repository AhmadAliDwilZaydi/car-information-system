const { StatusCodes } = require("http-status-codes");

function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || "Internal server error";

  // Mongo duplicate key error (mis. plat nomor sudah terdaftar)
  if (err.code === 11000) {
    statusCode = StatusCodes.CONFLICT;
    const field = Object.keys(err.keyValue || {})[0] || "data";
    const value = err.keyValue ? err.keyValue[field] : "";
    message = field === "licensePlate"
      ? `Plat nomor "${value}" sudah terdaftar`
      : `Nilai ${field} "${value}" sudah digunakan`;
  }

  res.status(statusCode).json({
    message,
    details: err.details || null
  });
}

module.exports = errorHandler;
