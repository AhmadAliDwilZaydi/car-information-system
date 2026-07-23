const Car = require("../models/Car");

async function getDashboardData() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const [totalCars, brands, models, carsAddedThisMonth, bodyTypeDistribution, priceDistribution, latestCars] = await Promise.all([
    Car.countDocuments(),
    Car.distinct('brand'),
    Car.distinct('model'),
    Car.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Car.aggregate([
      { $group: { _id: "$bodyType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Car.aggregate([
      {
        $bucket: {
          groupBy: "$priceNew",
          boundaries: [0, 200000000, 300000000, 500000000, 1000000000, 10000000000],
          default: "Lainnya",
          output: { count: { $sum: 1 } }
        }
      }
    ]),
    Car.find().sort({ createdAt: -1 }).limit(5)
  ]);

  return {
    totalCars,
    totalBrands: brands.length,
    totalModels: models.length,
    carsAddedThisMonth,
    bodyTypeDistribution: bodyTypeDistribution.map(b => ({ type: b._id, count: b.count })),
    priceDistribution: priceDistribution.map((b) => ({ range: String(b._id), count: b.count })),
    latestCars
  };
}

module.exports = {
  getDashboardData
};
