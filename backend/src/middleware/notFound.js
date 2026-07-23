const { StatusCodes } = require("http-status-codes");

function notFound(req, res) {
  res.status(StatusCodes.NOT_FOUND).json({
    message: "Route not found"
  });
}

module.exports = notFound;
