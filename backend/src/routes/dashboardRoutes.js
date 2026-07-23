const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * /dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Statistik katalog mobil (Admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistik dashboard dari agregasi MongoDB
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalCars: { type: integer, example: 77 }
 *                 totalBrands: { type: integer, example: 18 }
 *                 totalModels: { type: integer, example: 77 }
 *                 carsAddedThisMonth: { type: integer, example: 77 }
 *                 bodyTypeDistribution: { type: array, items: { type: object } }
 *                 priceDistribution: { type: array, items: { type: object } }
 *                 latestCars: { type: array, items: { $ref: '#/components/schemas/Car' } }
 *       401:
 *         description: Unauthorized â€” butuh token Admin
 */
router.get("/", auth, dashboardController.getDashboard);

module.exports = router;
