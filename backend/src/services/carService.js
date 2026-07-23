const { StatusCodes } = require("http-status-codes");
const Car = require("../models/Car");
const ApiError = require("../utils/apiError");
const { uploadImage, deleteImage } = require("./fileService");

async function listCars(query) {
  const { search = "", brand = "", model = "", year = "", minYear = "", maxYear = "", bodyType = "", transmissionType = "", fuelType = "", minPrice = "", maxPrice = "", page = 1, limit = 10 } = query;

  const filter = {};
  let searchYear;
  let textSearchFilter;

  if (search.trim()) {
    // Pencarian multi-kata dapat melintasi field brand dan model. Contoh
    // "Daihatsu Rocky" cocok dengan brand="Daihatsu" + model="Rocky",
    // sedangkan "Mitsubishi Xpander 2023" juga menambahkan filter tahun.
    const rawTerms = search.trim().toLowerCase().match(/[a-z0-9-]+/g) || [];
    const yearTerm = rawTerms.find((term) => /^\d{4}$/.test(term));
    const textTerms = rawTerms.filter((term) => !/^\d{4}$/.test(term));
    if (yearTerm) {
      searchYear = Number(yearTerm);
      filter.year = searchYear;
    }
    if (textTerms.length) {
      textSearchFilter = textTerms.map((term) => {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return {
          $or: [
            { brand: { $regex: escaped, $options: "i" } },
            { model: { $regex: escaped, $options: "i" } }
          ]
        };
      });
      filter.$and = textSearchFilter;
    }
  }
  if (brand) {
    filter.brand = { $regex: brand, $options: "i" };
  }
  if (model) {
    filter.model = { $regex: model, $options: "i" };
  }
  if (year) {
    filter.year = Number(year);
  } else if (minYear || maxYear) {
    filter.year = {};
    if (minYear) filter.year.$gte = Number(minYear);
    if (maxYear) filter.year.$lte = Number(maxYear);
  }
  if (bodyType) {
    filter.bodyType = { $regex: bodyType, $options: "i" };
  }
  if (transmissionType) {
    filter.transmissionType = { $regex: transmissionType, $options: "i" };
  }
  if (fuelType) {
    filter.fuelType = { $regex: fuelType, $options: "i" };
  }
  if (minPrice || maxPrice) {
    filter.priceNew = {};
    if (minPrice) filter.priceNew.$gte = Number(minPrice);
    if (maxPrice) filter.priceNew.$lte = Number(maxPrice);
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (safePage - 1) * safeLimit;

  let [items, total] = await Promise.all([
    Car.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit),
    Car.countDocuments(filter)
  ]);

  // Tahun pada kolom pencarian bebas bersifat membantu, bukan alasan untuk
  // menyembunyikan model yang sebenarnya tersedia pada tahun lain. Filter
  // tahun eksplisit tetap ketat (mis. ?year=2023), sedangkan "Xpander 2023"
  // dapat memberi hasil Xpander 2024 disertai pemberitahuan yang jujur.
  let searchNotice = "";
  const canRelaxSearchYear = searchYear && !year && !minYear && !maxYear && textSearchFilter?.length;
  if (canRelaxSearchYear && total === 0) {
    const relaxedFilter = { ...filter, $and: textSearchFilter };
    delete relaxedFilter.year;
    [items, total] = await Promise.all([
      Car.find(relaxedFilter).sort({ year: -1, createdAt: -1 }).skip(skip).limit(safeLimit),
      Car.countDocuments(relaxedFilter)
    ]);
    if (total > 0) {
      searchNotice = `Data dengan tahun ${searchYear} belum tersedia. Menampilkan model yang sama pada tahun yang tersedia.`;
    }
  }

  return {
    items,
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
      searchNotice
    }
  };
}

async function getCarById(id) {
  const car = await Car.findById(id);
  if (!car) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Car not found");
  }
  return car;
}

function generateObjectName(brand, model, year, angle, index, ext) {
  const cleanBrand = (brand || "unknown").toLowerCase().replace(/\s+/g, "_");
  const cleanModel = (model || "unknown").toLowerCase().replace(/\s+/g, "_");
  return `cars/${cleanBrand}_${cleanModel}_${year}_${angle}_${index}${ext}`;
}

async function deleteCarImages(car) {
  const urls = [...new Set([car.imageUrl, ...(car.imageGalleryUrls || [])].filter(Boolean))];
  await Promise.all(urls.map((url) => deleteImage(url.split("/").slice(-2).join("/"))));
}

async function createCar(payload, file) {
  const data = { ...payload };

  if (file) {
    const ext = require('path').extname(file.originalname);
    const objectName = generateObjectName(data.brand, data.model, data.year, 'front34', '01', ext);
    const uploaded = await uploadImage(file.buffer, file.originalname, file.mimetype, objectName);
    data.imageUrl = uploaded.url;
  }

  const car = await Car.create(data);
  if (car.imageUrl) {
    car.imageGalleryUrls = [car.imageUrl];
    await car.save();
  }
  return car;
}

async function updateCar(id, payload, file) {
  const car = await getCarById(id);

  if (file) {
    await deleteCarImages(car);
    const ext = require('path').extname(file.originalname);
    const objectName = generateObjectName(payload.brand || car.brand, payload.model || car.model, payload.year || car.year, 'front34', '01', ext);
    const uploaded = await uploadImage(file.buffer, file.originalname, file.mimetype, objectName);
    car.imageUrl = uploaded.url;
    car.imageGalleryUrls = [uploaded.url];
  }

  Object.assign(car, payload);
  await car.save();

  return car;
}

async function removeCar(id) {
  const car = await getCarById(id);
  await deleteCarImages(car);
  await car.deleteOne();
}

async function uploadCarImage(id, file) {
  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Image file is required");
  }

  const car = await getCarById(id);

  const ext = require('path').extname(file.originalname);
  const nextIndex = String((car.imageGalleryUrls || []).length + 1).padStart(2, "0");
  const objectName = generateObjectName(car.brand, car.model, car.year, 'front34', nextIndex, ext);
  const uploaded = await uploadImage(file.buffer, file.originalname, file.mimetype, objectName);

  if (!car.imageUrl) car.imageUrl = uploaded.url;
  car.imageGalleryUrls = [...(car.imageGalleryUrls || []), uploaded.url];
  await car.save();

  return car;
}

async function removeCarImage(id) {
  const car = await getCarById(id);

  await deleteCarImages(car);
  car.imageUrl = "";
  car.imageGalleryUrls = [];
  await car.save();

  return car;
}

async function replaceCarImage(id, file) {
  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Image file is required");
  }

  const car = await getCarById(id);

  await deleteCarImages(car);

  const ext = require('path').extname(file.originalname);
  const objectName = generateObjectName(car.brand, car.model, car.year, 'front34', '01', ext);
  const uploaded = await uploadImage(file.buffer, file.originalname, file.mimetype, objectName);

  car.imageUrl = uploaded.url;
  car.imageGalleryUrls = [uploaded.url];
  await car.save();

  return car;
}

module.exports = {
  listCars,
  getCarById,
  createCar,
  updateCar,
  removeCar,
  uploadCarImage,
  removeCarImage,
  replaceCarImage
};
