const express = require("express");
const { body } = require("express-validator");
const carController = require("../controllers/carController");
const auth = require("../middleware/auth");
const validateRequest = require("../middleware/validate");
const upload = require("../middleware/upload");

const router = express.Router();

const carValidators = [
  body("brand").notEmpty().withMessage("Brand wajib diisi"),
  body("model").notEmpty().withMessage("Model wajib diisi"),
  body("year").isInt({ min: 1900 }).withMessage("Tahun tidak valid"),
  body("bodyType").notEmpty().withMessage("Tipe bodi wajib diisi"),
  body("engineCapacity").isNumeric().withMessage("Kapasitas mesin harus angka"),
  body("horsepower").isNumeric().withMessage("Horsepower harus angka"),
  body("torque").isNumeric().withMessage("Torsi harus angka"),
  body("transmissionType").notEmpty().withMessage("Tipe transmisi wajib diisi"),
  body("fuelType").notEmpty().withMessage("Jenis bahan bakar wajib diisi"),
  body("length").isNumeric().withMessage("Panjang harus angka"),
  body("width").isNumeric().withMessage("Lebar harus angka"),
  body("height").isNumeric().withMessage("Tinggi harus angka"),
  body("groundClearance").isNumeric().withMessage("Ground clearance harus angka"),
  body("seatingCapacity").isInt({ min: 1 }).withMessage("Kapasitas penumpang harus angka minimal 1"),
  body("priceNew").isNumeric().withMessage("Harga baru harus angka")
];

const carUpdateValidators = [
  body("brand").optional().trim().notEmpty(), body("model").optional().trim().notEmpty(),
  body("year").optional().isInt({ min: 1900 }), body("bodyType").optional().trim().notEmpty(),
  body("engineCapacity").optional().isNumeric(), body("horsepower").optional().isNumeric(), body("torque").optional().isNumeric(),
  body("transmissionType").optional().isIn(["Manual", "Automatic", "CVT", "DCT", "AMT", "Other"]),
  body("fuelType").optional().isIn(["Bensin", "Diesel", "Hybrid", "Listrik", "Other"]),
  body("length").optional().isNumeric(), body("width").optional().isNumeric(), body("height").optional().isNumeric(),
  body("groundClearance").optional().isNumeric(), body("seatingCapacity").optional().isInt({ min: 1 }),
  body("priceNew").optional().isNumeric(), body("condition").optional().isIn(["Baru", "Bekas", "Baru & Bekas"])
];

/**
 * @swagger
 * tags:
 *   name: Cars
 *   description: Manajemen data informasi kendaraan
 */

/**
 * @swagger
 * /cars:
 *   get:
 *     tags: [Cars]
 *     security: []
 *     summary: Daftar semua mobil dengan filter dan pagination
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Pencarian bebas (merek/model)
 *       - in: query
 *         name: brand
 *         schema: { type: string }
 *       - in: query
 *         name: model
 *         schema: { type: string }
 *       - in: query
 *         name: year
 *         schema: { type: integer }
 *       - in: query
 *         name: minYear
 *         schema: { type: integer }
 *       - in: query
 *         name: maxYear
 *         schema: { type: integer }
 *       - in: query
 *         name: bodyType
 *         schema: { type: string }
 *       - in: query
 *         name: transmissionType
 *         schema: { type: string }
 *       - in: query
 *         name: fuelType
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Daftar mobil berhasil diambil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Car'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     totalPages: { type: integer }
 */
router.get("/", carController.listCars);

/**
 * @swagger
 * /cars/{id}:
 *   get:
 *     tags: [Cars]
 *     security: []
 *     summary: Detail spesifikasi lengkap satu mobil
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId mobil
 *     responses:
 *       200:
 *         description: Data mobil ditemukan
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Car'
 *       404:
 *         description: Mobil tidak ditemukan
 */
router.get("/:id", carController.getCar);

/**
 * @swagger
 * /cars:
 *   post:
 *     tags: [Cars]
 *     summary: Tambah data mobil baru (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [brand, model, year, bodyType, engineCapacity, horsepower, torque, transmissionType, fuelType, length, width, height, groundClearance, seatingCapacity, priceNew]
 *             properties:
 *               brand: { type: string, example: "Toyota" }
 *               model: { type: string, example: "Avanza" }
 *               year: { type: integer, example: 2024 }
 *               bodyType: { type: string, example: "MPV" }
 *               variant: { type: string, example: "1.5 G TSS" }
 *               engineCapacity: { type: number, example: 1496 }
 *               horsepower: { type: number, example: 106 }
 *               torque: { type: number, example: 137 }
 *               transmissionType: { type: string, enum: [Manual, Automatic, CVT, DCT, AMT], example: "CVT" }
 *               fuelType: { type: string, enum: [Bensin, Diesel, Hybrid, Listrik], example: "Bensin" }
 *               length: { type: number, example: 4395 }
 *               width: { type: number, example: 1730 }
 *               height: { type: number, example: 1700 }
 *               groundClearance: { type: number, example: 205 }
 *               seatingCapacity: { type: integer, example: 7 }
 *               priceNew: { type: number, example: 272000000 }
 *               priceUsed: { type: string, example: "220000000 - 240000000" }
 *               condition: { type: string, enum: [Baru, Bekas, "Baru & Bekas"], example: "Baru & Bekas" }
 *               image: { type: string, format: binary, description: "File gambar eksterior mobil" }
 *     responses:
 *       201:
 *         description: Mobil berhasil ditambahkan
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Unauthorized — butuh token Admin
 */
router.post("/", auth, upload.single("image"), carValidators, validateRequest, carController.createCar);

/**
 * @swagger
 * /cars/{id}:
 *   put:
 *     tags: [Cars]
 *     summary: Update data mobil (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               brand: { type: string }
 *               model: { type: string }
 *               year: { type: integer }
 *               image: { type: string, format: binary, description: "Ganti gambar (opsional)" }
 *     responses:
 *       200:
 *         description: Data mobil berhasil diupdate
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Mobil tidak ditemukan
 */
router.put("/:id", auth, upload.single("image"), carUpdateValidators, validateRequest, carController.updateCar);

/**
 * @swagger
 * /cars/{id}:
 *   delete:
 *     tags: [Cars]
 *     summary: Hapus data mobil (Admin) — juga menghapus gambar dari MinIO
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Mobil berhasil dihapus
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Mobil tidak ditemukan
 */
router.delete("/:id", auth, carController.removeCar);

/**
 * @swagger
 * /cars/{id}/image:
 *   post:
 *     tags: [Cars]
 *     summary: Upload gambar mobil ke MinIO (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Gambar berhasil diupload ke MinIO
 *       400:
 *         description: File gambar tidak ditemukan di request
 *       401:
 *         description: Unauthorized
 */
router.post("/:id/image", auth, upload.single("image"), carController.uploadCarImage);

/**
 * @swagger
 * /cars/{id}/image:
 *   put:
 *     tags: [Cars]
 *     summary: Ganti (replace) gambar mobil di MinIO (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Gambar berhasil diganti
 *       401:
 *         description: Unauthorized
 */
router.put("/:id/image", auth, upload.single("image"), carController.replaceCarImage);

/**
 * @swagger
 * /cars/{id}/image:
 *   delete:
 *     tags: [Cars]
 *     summary: Hapus gambar mobil dari MinIO (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Gambar berhasil dihapus dari MinIO
 *       401:
 *         description: Unauthorized
 */
router.delete("/:id/image", auth, carController.removeCarImage);

/**
 * @swagger
 * components:
 *   schemas:
 *     Car:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         brand: { type: string, example: "Toyota" }
 *         model: { type: string, example: "Avanza" }
 *         year: { type: integer, example: 2024 }
 *         bodyType: { type: string, example: "MPV" }
 *         variant: { type: string, example: "1.5 G" }
 *         engineCapacity: { type: number, example: 1496 }
 *         horsepower: { type: number, example: 106 }
 *         torque: { type: number, example: 137 }
 *         transmissionType: { type: string, example: "CVT" }
 *         fuelType: { type: string, example: "Bensin" }
 *         engineType: { type: string, example: "Bensin inline 4-silinder" }
 *         cylinders: { type: number, example: 4 }
 *         drivetrain: { type: string, example: "FWD" }
 *         fuelTankCapacity: { type: number, example: 50 }
 *         batteryCapacity: { type: number, example: 0 }
 *         electricRange: { type: number, example: 0 }
 *         chargingTime: { type: string, example: "Tidak berlaku" }
 *         topSpeed: { type: number, example: 190 }
 *         acceleration: { type: number, example: 11.5 }
 *         length: { type: number, example: 4395 }
 *         width: { type: number, example: 1730 }
 *         height: { type: number, example: 1700 }
 *         groundClearance: { type: number, example: 205 }
 *         seatingCapacity: { type: integer, example: 7 }
 *         wheelbase: { type: number, example: 2750 }
 *         frontSuspension: { type: string }
 *         rearSuspension: { type: string }
 *         brakeType: { type: string }
 *         tireSize: { type: string }
 *         safetyFeatures: { type: array, items: { type: string } }
 *         entertainmentFeatures: { type: array, items: { type: string } }
 *         priceNew: { type: number, example: 272000000 }
 *         priceUsed: { type: string, example: "220000000 - 240000000" }
 *         condition: { type: string, example: "Baru & Bekas" }
 *         warranty: { type: string, example: "Garansi kendaraan 3 tahun / 100.000 km" }
 *         imageUrl: { type: string, example: "http://localhost:9000/car-images/cars/toyota_avanza_2024_front34_01.jpg" }
 *         imageGalleryUrls: { type: array, items: { type: string } }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 */

module.exports = router;
