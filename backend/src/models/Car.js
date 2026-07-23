const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    // Identitas Kendaraan
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
    },
    bodyType: {
      type: String,
      required: true,
      trim: true,
    },
    variant: {
      type: String,
      trim: true,
    },

    // Spesifikasi Teknis
    engineCapacity: {
      type: Number,
      required: true, // cc
    },
    horsepower: {
      type: Number,
      required: true, // HP
    },
    torque: {
      type: Number,
      required: true, // Nm
    },
    transmissionType: {
      type: String,
      required: true,
      enum: ['Manual', 'Automatic', 'CVT', 'DCT', 'AMT', 'Other'],
    },
    fuelType: {
      type: String,
      required: true,
      enum: ['Bensin', 'Diesel', 'Hybrid', 'Listrik', 'Other'],
    },
    engineType: { type: String, trim: true },
    cylinders: { type: Number, min: 0 },
    drivetrain: { type: String, trim: true },
    fuelTankCapacity: { type: Number, min: 0 }, // liter; 0 untuk EV murni
    batteryCapacity: { type: Number, min: 0 }, // kWh untuk EV/hybrid bila tersedia
    electricRange: { type: Number, min: 0 }, // km untuk EV
    chargingTime: { type: String, trim: true },
    topSpeed: { type: Number, min: 0 }, // km/jam
    acceleration: { type: Number, min: 0 }, // 0-100 km/jam, detik

    // Dimensi Kendaraan
    length: {
      type: Number,
      required: true, // mm
    },
    width: {
      type: Number,
      required: true, // mm
    },
    height: {
      type: Number,
      required: true, // mm
    },
    groundClearance: {
      type: Number,
      required: true, // mm
    },
    seatingCapacity: {
      type: Number,
      required: true,
    },
    wheelbase: { type: Number, min: 0 }, // mm
    frontSuspension: { type: String, trim: true },
    rearSuspension: { type: String, trim: true },
    brakeType: { type: String, trim: true },
    tireSize: { type: String, trim: true },

    // Fitur & Harga
    safetyFeatures: [
      {
        type: String,
        trim: true,
      },
    ],
    entertainmentFeatures: [
      {
        type: String,
        trim: true,
      },
    ],
    priceNew: {
      type: Number,
      required: true,
    },
    priceUsed: {
      type: String, // String to allow ranges, e.g. "200M - 250M" or exact
      trim: true,
    },
    condition: {
      type: String,
      enum: ['Baru', 'Bekas', 'Baru & Bekas'],
      default: 'Baru & Bekas',
    },
    warranty: { type: String, trim: true },

    // Media
    imageUrl: {
      type: String, // Main image from MinIO
      trim: true,
    },
    imageGalleryUrls: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for fast searching on large vehicle reference datasets.
carSchema.index({ brand: 1 });
carSchema.index({ model: 1 });
carSchema.index({ year: 1 });
carSchema.index({ bodyType: 1 });
carSchema.index({ priceNew: 1 });
carSchema.index({ brand: 'text', model: 'text' }); // Text index for free-text search

const Car = mongoose.model('Car', carSchema);

module.exports = Car;
