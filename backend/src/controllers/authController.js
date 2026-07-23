const { StatusCodes } = require("http-status-codes");
const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/authService");

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.status(StatusCodes.OK).json(result);
});

const logout = asyncHandler(async (req, res) => {
  res.status(StatusCodes.OK).json({ message: "Logout success" });
});

module.exports = {
  login,
  logout
};
