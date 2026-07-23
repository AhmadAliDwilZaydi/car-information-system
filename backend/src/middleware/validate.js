const { validationResult } = require("express-validator");
const { StatusCodes } = require("http-status-codes");

function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  return res.status(StatusCodes.BAD_REQUEST).json({
    message: "Validation failed",
    errors: result.array()
  });
}

module.exports = validateRequest;
