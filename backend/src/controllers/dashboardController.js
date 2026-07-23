const { StatusCodes } = require("http-status-codes");
const asyncHandler = require("../utils/asyncHandler");
const dashboardService = require("../services/dashboardService");

const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboardData();
  res.status(StatusCodes.OK).json(data);
});

module.exports = {
  getDashboard
};
