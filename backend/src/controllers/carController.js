const { StatusCodes } = require("http-status-codes");
const asyncHandler = require("../utils/asyncHandler");
const carService = require("../services/carService");

const listCars = asyncHandler(async (req, res) => {
  const data = await carService.listCars(req.query);
  res.status(StatusCodes.OK).json(data);
});

const getCar = asyncHandler(async (req, res) => {
  const data = await carService.getCarById(req.params.id);
  res.status(StatusCodes.OK).json(data);
});

const createCar = asyncHandler(async (req, res) => {
  const data = await carService.createCar(req.body, req.file);
  res.status(StatusCodes.CREATED).json(data);
});

const updateCar = asyncHandler(async (req, res) => {
  const data = await carService.updateCar(req.params.id, req.body, req.file);
  res.status(StatusCodes.OK).json(data);
});

const removeCar = asyncHandler(async (req, res) => {
  await carService.removeCar(req.params.id);
  res.status(StatusCodes.OK).json({ message: "Car deleted" });
});

const uploadCarImage = asyncHandler(async (req, res) => {
  const data = await carService.uploadCarImage(req.params.id, req.file);
  res.status(StatusCodes.OK).json(data);
});

const removeCarImage = asyncHandler(async (req, res) => {
  const data = await carService.removeCarImage(req.params.id);
  res.status(StatusCodes.OK).json(data);
});

const replaceCarImage = asyncHandler(async (req, res) => {
  const data = await carService.replaceCarImage(req.params.id, req.file);
  res.status(StatusCodes.OK).json(data);
});

module.exports = {
  listCars,
  getCar,
  createCar,
  updateCar,
  removeCar,
  uploadCarImage,
  removeCarImage,
  replaceCarImage
};
