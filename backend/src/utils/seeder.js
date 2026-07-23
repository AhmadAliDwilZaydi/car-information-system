require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const Car = require("../models/Car");
const seedData = require("../data/cars.seed.json");
const additionalSeedData = require("../data/additionalCars.seed");
const { minioClient, ensureBucket } = require("../config/minio");
const env = require("../config/env");
const fs = require("fs");
const path = require("path");

const catalogImages = {
  MPV: fs.readFileSync(path.join(__dirname, "../assets/car-exterior-catalog.jpg")),
  SUV: fs.readFileSync(path.join(__dirname, "../assets/car-exterior-suv.jpg")),
  Pickup: fs.readFileSync(path.join(__dirname, "../assets/car-exterior-pickup.jpg")),
  default: fs.readFileSync(path.join(__dirname, "../assets/car-exterior-sedan-hatch.jpg"))
};

function objectNameFor(car) {
  const brand = car.brand.toLowerCase().replace(/\s+/g, "_");
  const model = car.model.toLowerCase().replace(/\s+/g, "_");
  return `cars/${brand}_${model}_${car.year}_front34_01.jpg`;
}

function toStringArray(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (value === undefined || value === null || value === "") return [];
  return [String(value).trim()].filter(Boolean);
}

function enrichCar(source) {
  const car = { ...source };
  const isElectric = car.fuelType === "Listrik";
  const isHybrid = car.fuelType === "Hybrid";
  const isPickup = car.bodyType === "Pickup";
  car.engineType ||= isElectric ? "Motor listrik magnet permanen" : isHybrid ? "Mesin bensin hybrid 4-silinder" : car.fuelType === "Diesel" ? "Turbo diesel common-rail 4-silinder" : "Bensin inline 4-silinder";
  car.cylinders ??= isElectric ? 0 : 4;
  car.drivetrain ||= isPickup ? "RWD / 4WD" : "FWD";
  car.fuelTankCapacity ??= isElectric ? 0 : car.bodyType === "MPV" || car.bodyType === "SUV" ? 50 : 40;
  car.batteryCapacity ??= isElectric ? 60 : isHybrid ? 1.8 : 0;
  car.electricRange ??= isElectric ? 400 : 0;
  car.chargingTime ||= isElectric ? "DC fast charging 30–45 menit (10–80%)" : "Tidak berlaku";
  car.topSpeed ??= isElectric ? 170 : isPickup ? 180 : 190;
  car.acceleration ??= isElectric ? 8.5 : 11.5;
  car.wheelbase ??= Math.max(2300, car.length - (car.bodyType === "Pickup" ? 1100 : 750));
  car.frontSuspension ||= "MacPherson strut";
  car.rearSuspension ||= isPickup ? "Leaf spring" : "Torsion beam / multi-link";
  car.brakeType ||= "Cakram depan ventilated / cakram belakang";
  car.tireSize ||= car.bodyType === "Pickup" || car.bodyType === "SUV" ? "225/60 R18" : "205/55 R16";
  car.warranty ||= "Garansi kendaraan 3 tahun / 100.000 km";
  car.safetyFeatures = toStringArray(car.safetyFeatures);
  car.entertainmentFeatures = toStringArray(car.entertainmentFeatures);
  car.imageGalleryUrls = toStringArray(car.imageGalleryUrls);
  return car;
}

async function backfillTechnicalSpecifications() {
  const cars = await Car.find({
    $or: [{ engineType: { $exists: false } }, { wheelbase: { $exists: false } }, { warranty: { $exists: false } }]
  });
  if (!cars.length) return 0;
  await Promise.all(cars.map(async (document) => {
    const enriched = enrichCar(document.toObject());
    Object.assign(document, enriched);
    await document.save();
  }));
  return cars.length;
}

function buildPublicUrl(objectName) {
  return `${env.minio.publicUrl}/${env.minio.bucketName}/${objectName}`;
}

async function clearCarObjects() {
  const objectNames = [];
  const stream = minioClient.listObjectsV2(env.minio.bucketName, "cars/", true);
  await new Promise((resolve, reject) => {
    stream.on("data", (object) => objectNames.push(object.name));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  if (objectNames.length) await minioClient.removeObjects(env.minio.bucketName, objectNames);
}

async function seedCarsIfEmpty({ fresh = false } = {}) {
  const existingCount = await Car.countDocuments();
  if (!fresh && existingCount > 0) {
    const updated = await backfillTechnicalSpecifications();
    if (updated) console.log(`Backfilled technical specifications for ${updated} existing cars.`);
    console.log(`Found ${existingCount} cars in DB. Skipping seeding.`);
    return { seeded: false, count: existingCount };
  }

  if (fresh) {
    await Car.deleteMany({});
  }
  await ensureBucket();
  if (fresh) await clearCarObjects();

  const cars = [];
  for (const source of [...seedData, ...additionalSeedData]) {
    const car = enrichCar(source);
    const objectName = objectNameFor(car);
    const image = catalogImages[car.bodyType] || catalogImages.default;
    await minioClient.putObject(env.minio.bucketName, objectName, image, {
      "Content-Type": "image/jpeg"
    });
    car.imageUrl = buildPublicUrl(objectName);
    car.imageGalleryUrls = [car.imageUrl];
    cars.push(car);
  }
  await Car.insertMany(cars);
  console.log(`Successfully seeded ${cars.length} cars with catalog images in MinIO.`);
  return { seeded: true, count: cars.length };
}

async function runCli() {
  try {
    await mongoose.connect(env.mongoUri);
    await seedCarsIfEmpty({ fresh: process.argv.includes("--fresh") });
    await mongoose.disconnect();
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exitCode = 1;
  }
}

if (require.main === module) runCli();

module.exports = { seedCarsIfEmpty, enrichCar, backfillTechnicalSpecifications };
