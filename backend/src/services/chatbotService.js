const axios = require('axios');
const Car = require('../models/Car');
const ChatHistory = require('../models/ChatHistory');
const ApiError = require('../utils/apiError');
const { StatusCodes } = require('http-status-codes');
const env = require("../config/env");

const OLLAMA_BASE_URL = env.ollama.baseUrl;
const OLLAMA_MODEL = env.ollama.model;

const KNOWN_BODY_TYPES = ["SUV", "MPV", "Sedan", "Hatchback", "Pickup"];
const KNOWN_FUELS = ["Bensin", "Diesel", "Hybrid", "Listrik"];
const RECOMMENDATION_PATTERN = /\b(rekomendasi|rekomendasikan|saran|sarankan|pilihan|carikan|cari.*mobil|mobil.*cocok)\b/i;
const COMPARISON_PATTERN = /\b(bandingkan|perbandingan|versus|vs)\b/i;

function extractBudget(message) {
  const match = message.toLowerCase().match(/(?:di\s*bawah|kurang\s*dari|max(?:imal)?|budget)\s*(\d+(?:[.,]\d+)?)\s*(juta|miliar|milyar)/);
  if (!match) return null;
  const amount = Number(match[1].replace(",", "."));
  return amount * (match[2] === "juta" ? 1_000_000 : 1_000_000_000);
}

function buildRetrievalFilter(message, { includeKeywords = true } = {}) {
  const normalized = message.toLowerCase();
  const and = [];
  const bodyType = KNOWN_BODY_TYPES.find((type) => normalized.includes(type.toLowerCase()));
  const fuelType = KNOWN_FUELS.find((type) => normalized.includes(type.toLowerCase()));
  const budget = extractBudget(message);
  if (bodyType) and.push({ bodyType });
  if (fuelType) and.push({ fuelType });
  if (budget) and.push({ priceNew: { $lte: budget } });

  // Kebutuhan umum dibuat menjadi filter katalog, bukan dipaksa sebagai
  // keyword merek/model. Dengan ini rekomendasi keluarga/kota tetap relevan.
  if (RECOMMENDATION_PATTERN.test(message)) {
    if (/\b(keluarga|anak|7\s*(kursi|penumpang)|tujuh\s*(kursi|penumpang))\b/i.test(message)) {
      and.push({ seatingCapacity: { $gte: 7 } });
    } else if (!bodyType && /\b(kota|urban|kompak|parkir)\b/i.test(message)) {
      and.push({ bodyType: { $in: ["Hatchback", "Sedan"] } });
    } else if (!bodyType && /\b(offroad|off-road|medan|jalanan rusak|tangguh)\b/i.test(message)) {
      and.push({ bodyType: { $in: ["SUV", "Pickup"] } });
    } else if (!fuelType && /\b(hemat|irit|efisien)\b/i.test(message)) {
      and.push({ fuelType: { $in: ["Hybrid", "Listrik"] } });
    }
  }

  // Jangan jadikan tipe bodi, bahan bakar, angka, atau satuan harga sebagai
  // keyword merek/model. Contoh: "mobil listrik di bawah 600 juta" cukup
  // memakai filter fuelType + priceNew, bukan regex "listrik|600|juta".
  const filterTerms = new Set([
    "mobil", "yang", "dengan", "untuk", "harga", "bawah", "kurang", "dari",
    "rekomendasi", "spesifikasi", "bandingkan", "berapa", "di", "dan", "atau",
    "juta", "miliar", "milyar", "maksimal", "budget", "lebih", "hingga",
    "tipe", "jenis", "pilihan", "cari", "carikan", "saya", "ingin", "mohon", "tolong",
    "keluarga", "beserta", "alasan", "alasannya", "cocok", "butuh", "kebutuhan",
    "bagus", "terbaik", "dengan", "fitur", "lengkap", "irit", "hemat", "harian",
    "bahan", "bakar", "mesin", "motor", "beserta", "alasannya", "alasan"
  ]);
  KNOWN_BODY_TYPES.forEach((type) => filterTerms.add(type.toLowerCase()));
  KNOWN_FUELS.forEach((fuel) => filterTerms.add(fuel.toLowerCase()));
  const keywords = normalized
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9-]/g, ""))
    .filter((word) => word.length > 2 && !/^\d+$/.test(word) && !filterTerms.has(word));
  if (includeKeywords && keywords.length) {
    const expression = keywords.map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    and.push({ $or: [
      { brand: { $regex: expression, $options: "i" } },
      { model: { $regex: expression, $options: "i" } },
      { bodyType: { $regex: expression, $options: "i" } },
      { fuelType: { $regex: expression, $options: "i" } }
    ] });
  }
  return and.length ? { $and: and } : {};
}

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString("id-ID")}`;
}

function buildCatalogRecommendation(cars) {
  if (!cars.length) {
    return "Belum ada mobil di katalog yang cocok dengan kebutuhan tersebut. Coba ubah batas harga, tipe bodi, bahan bakar, atau kata kunci.";
  }

  const lines = cars.slice(0, 5).map((car, index) => {
    const reasons = [
      `${car.bodyType}, ${car.seatingCapacity} kursi`,
      `${car.transmissionType} / ${car.fuelType}`,
      `${car.engineCapacity} cc, ${car.horsepower} HP`,
      `harga baru ${formatRupiah(car.priceNew)}`
    ];
    if (car.priceUsed) reasons.push(`estimasi bekas ${formatRupiahRange(car.priceUsed)}`);
    return `${index + 1}. ${car.brand} ${car.model} (${car.year}${car.variant ? `, ${car.variant}` : ""})\n   ${reasons.join(" • ")}\n   Detail: /cars/${car._id}`;
  });
  return `Rekomendasi berikut diambil langsung dari katalog mobil:\n\n${lines.join("\n\n")}`;
}

function formatRupiahRange(value) {
  const numbers = String(value).match(/\d+/g);
  return numbers?.length ? numbers.map((number) => formatRupiah(number)).join(" - ") : String(value);
}

function carLabel(car) {
  return `${car.brand} ${car.model} (${car.year}${car.variant ? `, ${car.variant}` : ""})`;
}

// Jawaban ranking dibuat langsung dari MongoDB. Ini membuat pertanyaan seperti
// "mobil apa yang torsinya paling tinggi?" tetap akurat walaupun Ollama sedang
// tidak dapat dihubungi atau kata pertanyaannya tidak ada di merek/model.
function buildCatalogRankingAnswer(message, cars) {
  const normalized = message.toLowerCase();
  const wantsHighest = /\b(paling|tertinggi|terbesar|maksimum|max|kuat)\b/i.test(normalized);
  const wantsLowest = /\b(termurah|terendah|terkecil|minimum|min)\b/i.test(normalized);
  if (!wantsHighest && !wantsLowest) return null;

  const metrics = [
    {
      matches: /\btorsi(?:nya)?\b/i,
      field: "torque",
      label: "torsi",
      unit: "Nm",
      format: (car) => `${car.torque} Nm`
    },
    {
      matches: /\b(tenaga|horsepower|hp|performa)\b/i,
      field: "horsepower",
      label: "tenaga",
      unit: "HP",
      format: (car) => `${car.horsepower} HP`
    },
    {
      matches: /\b(kapasitas mesin|mesin terbesar|cc)\b/i,
      field: "engineCapacity",
      label: "kapasitas mesin",
      unit: "cc",
      format: (car) => `${car.engineCapacity} cc`
    },
    {
      matches: /\b(ground clearance|jarak terendah|tinggi mobil)\b/i,
      field: "groundClearance",
      label: "ground clearance",
      unit: "mm",
      format: (car) => `${car.groundClearance} mm`
    },
    {
      matches: /\b(harga|mahal|murah)\b/i,
      field: "priceNew",
      label: "harga baru",
      unit: "",
      format: (car) => formatRupiah(car.priceNew)
    },
    {
      matches: /\b(kursi|penumpang|kapasitas)\b/i,
      field: "seatingCapacity",
      label: "kapasitas penumpang",
      unit: "kursi",
      format: (car) => `${car.seatingCapacity} kursi`
    }
  ];
  const metric = metrics.find((item) => item.matches.test(normalized));
  if (!metric) return null;

  const ranked = cars
    .filter((car) => Number.isFinite(Number(car[metric.field])))
    .sort((a, b) => wantsLowest ? Number(a[metric.field]) - Number(b[metric.field]) : Number(b[metric.field]) - Number(a[metric.field]))
    .slice(0, 3);
  if (!ranked.length) return null;

  const direction = wantsLowest ? "terendah" : "tertinggi";
  const lines = ranked.map((car, index) =>
    `${index + 1}. ${carLabel(car)} — ${metric.format(car)}; ${car.bodyType}, ${car.fuelType}; harga baru ${formatRupiah(car.priceNew)}. Detail: /cars/${car._id}`
  );
  return {
    message: `Berdasarkan ${cars.length} data mobil di katalog, berikut mobil dengan ${metric.label} ${direction}:\n\n${lines.join("\n")}`,
    cars: ranked
  };
}

function buildAutomotiveEducationAnswer(message) {
  const normalized = message.toLowerCase();
  if (/\b(apa itu|jelaskan|pengertian)\b/.test(normalized) && /\btorsi\b/.test(normalized)) {
    return "Torsi adalah gaya puntir mesin yang membantu mobil berakselerasi dan menarik beban. Satuan torsi adalah Newton meter (Nm). Secara sederhana, torsi besar terasa lebih kuat saat mulai berjalan, menanjak, atau membawa penumpang/barang.";
  }
  if (/\b(apa itu|jelaskan|pengertian)\b/.test(normalized) && /\bcvt\b/.test(normalized)) {
    return "CVT (Continuously Variable Transmission) adalah transmisi otomatis tanpa perpindahan gigi bertingkat seperti otomatis konvensional. Perpindahan tenaganya lebih halus dan umumnya nyaman untuk penggunaan kota.";
  }
  if (/\b(apa itu|jelaskan|pengertian)\b/.test(normalized) && /\bground clearance\b/.test(normalized)) {
    return "Ground clearance adalah jarak antara bagian terendah mobil dengan permukaan jalan. Nilai yang lebih tinggi membantu mobil melewati jalan tidak rata atau genangan dengan ruang lebih aman.";
  }
  return null;
}

function buildCatalogComparison(cars) {
  if (cars.length < 2) return buildCatalogRecommendation(cars);
  const compared = cars.slice(0, 2);
  return [
    "Perbandingan berikut diambil langsung dari data katalog:",
    "| Mobil | Harga Baru | Mesin | Tenaga | Transmisi | Bahan Bakar | Kursi |",
    "|---|---:|---:|---:|---|---|---:|",
    ...compared.map((car) => `| ${car.brand} ${car.model} (${car.year}) | ${formatRupiah(car.priceNew)} | ${car.engineCapacity} cc | ${car.horsepower} HP | ${car.transmissionType} | ${car.fuelType} | ${car.seatingCapacity} |`),
    "",
    ...compared.map((car) => `Detail ${car.brand} ${car.model}: /cars/${car._id}`)
  ].join("\n");
}

function buildFallbackMessage(message, relevantCars) {
  if (!relevantCars.length) {
    return "Belum ada mobil di katalog yang cocok untuk pertanyaan ini. Coba ubah kata kunci, batas harga, tipe bodi, atau bahan bakar.";
  }

  if (/\b(bandingkan|perbandingan|versus|vs)\b/i.test(message) && relevantCars.length >= 2) {
    const compared = relevantCars.slice(0, 2);
    return [
      "Berikut perbandingan ringkas berdasarkan data katalog:",
      "| Mobil | Harga Baru | Mesin | Tenaga | Transmisi | Bahan Bakar |",
      "|---|---:|---:|---:|---|---|",
      ...compared.map((car) => `| ${car.brand} ${car.model} (${car.year}) | Rp${car.priceNew.toLocaleString("id-ID")} | ${car.engineCapacity} cc | ${car.horsepower} HP | ${car.transmissionType} | ${car.fuelType} |`)
    ].join("\n");
  }

  return `Berdasarkan data katalog, saya menemukan: ${relevantCars.map((car) => `${car.brand} ${car.model} (${car.year})`).join(", ")}. Anda dapat membuka detail mobil untuk melihat spesifikasi dan estimasi harganya.`;
}

async function generateChatResponse(sessionId, message) {
  // 1. Fetch conversation history for this session
  const history = await ChatHistory.find({ sessionId }).sort({ createdAt: 1 });
  
  // Retrieval ringan berbasis merek/model/segmen/bahan bakar dan budget.
  const isRecommendation = RECOMMENDATION_PATTERN.test(message);
  let relevantCars = await Car.find(buildRetrievalFilter(message)).sort({ priceNew: 1 }).limit(6);
  // Kata kebutuhan seperti "mudik" atau "mobil kota" tidak selalu terdapat
  // pada field brand/model. Jika pencarian spesifik kosong, pertahankan hanya
  // constraint objektif (bodi, bahan bakar, budget, kapasitas kursi) agar
  // rekomendasi tetap berasal dari katalog yang relevan.
  if (isRecommendation && !relevantCars.length) {
    relevantCars = await Car.find(buildRetrievalFilter(message, { includeKeywords: false })).sort({ priceNew: 1 }).limit(6);
  }
  // Untuk pertanyaan umum yang tidak menyebut merek/model, tetap sediakan
  // contoh mobil nyata sebagai konteks; jangan menganggap katalog kosong.
  if (!relevantCars.length) {
    relevantCars = await Car.find({}).sort({ priceNew: 1 }).limit(6);
  }

  let referencedCarIds = relevantCars.map(car => car._id);

  // 3. Prepare the system prompt with context
  let systemPrompt = `Kamu adalah Atlas, asisten Car Information System. Jawab dalam Bahasa Indonesia dan hanya berdasarkan konteks katalog yang diberikan. Bantu pencarian, perbandingan spesifikasi, rekomendasi berdasarkan kebutuhan/anggaran, dan edukasi istilah otomotif. Sistem ini BUKAN rental: jangan membahas biaya sewa, booking, denda, transaksi, atau ketersediaan armada. ATURAN KETAT: untuk rekomendasi atau perbandingan mobil, hanya sebutkan merek/model yang tercantum pada KONTEKS DATA MOBIL; jangan pernah mengarang mobil, harga, atau fitur dari luar katalog. Jika konteks mobil kosong, katakan data tidak tersedia dan arahkan pengguna memakai filter katalog. Untuk rekomendasi, sebutkan alasan berdasarkan data.`;
  
  if (relevantCars.length > 0) {
    systemPrompt += `\n\nKONTEKS DATA MOBIL:\n`;
    relevantCars.forEach(car => {
      systemPrompt += `- ${car.brand} ${car.model} (${car.year}, ${car.variant || "varian umum"}): ${car.bodyType}; ${car.transmissionType}; ${car.fuelType}; mesin/motor ${car.engineCapacity}cc; ${car.horsepower} HP; ${car.torque} Nm; ${car.seatingCapacity} kursi; ground clearance ${car.groundClearance}mm; harga baru Rp${car.priceNew}; estimasi bekas Rp${car.priceUsed || "belum tersedia"}; fitur keselamatan: ${(car.safetyFeatures || []).join(", ")}. ID: ${car._id}.\n`;
    });
  } else {
    systemPrompt += `\n\nTidak ada data mobil yang cocok pada katalog untuk pertanyaan ini.`;
  }

  // 4. Construct messages array for Ollama
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({ role: h.role, content: h.message })),
    { role: 'user', content: message }
  ];

  // 5. Save user message to history
  await ChatHistory.create({
    sessionId,
    role: 'user',
    message
  });

  const educationAnswer = buildAutomotiveEducationAnswer(message);
  if (educationAnswer) {
    await ChatHistory.create({ sessionId, role: "assistant", message: educationAnswer, referencedCarIds: [] });
    return { message: educationAnswer, referencedCars: [], source: "education" };
  }

  const needsCatalogRanking = /\b(torsi(?:nya)?|tenaga|horsepower|\bhp\b|harga|mahal|murah|kapasitas mesin|\bcc\b|ground clearance|kursi|penumpang)\b/i.test(message);
  if (needsCatalogRanking) {
    const allCars = await Car.find({}).lean();
    const rankingAnswer = buildCatalogRankingAnswer(message, allCars);
    if (rankingAnswer) {
      referencedCarIds = rankingAnswer.cars.map((car) => car._id);
      await ChatHistory.create({ sessionId, role: "assistant", message: rankingAnswer.message, referencedCarIds });
      return { message: rankingAnswer.message, referencedCars: rankingAnswer.cars, source: "catalog" };
    }
  }

  // Rekomendasi dan perbandingan harus akurat terhadap data aplikasi.
  // Karena itu keduanya dibentuk langsung dari record MongoDB, bukan dari
  // teks generatif yang berpotensi mengubah harga atau spesifikasi.
  if (COMPARISON_PATTERN.test(message) || isRecommendation) {
    const assistantMessage = COMPARISON_PATTERN.test(message)
      ? buildCatalogComparison(relevantCars)
      : buildCatalogRecommendation(relevantCars);
    await ChatHistory.create({ sessionId, role: "assistant", message: assistantMessage, referencedCarIds });
    return { message: assistantMessage, referencedCars: relevantCars, source: "catalog" };
  }

  try {
    // 6. Call Ollama API
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: messages,
      stream: false
    }, { timeout: 20000 });

    const assistantMessage = response.data.message.content;

    // 7. Save assistant message to history
    await ChatHistory.create({
      sessionId,
      role: 'assistant',
      message: assistantMessage,
      referencedCarIds
    });

    return {
      message: assistantMessage,
      referencedCars: relevantCars
    };
  } catch (error) {
    console.error('Ollama API Error:', error.message);
    const fallback = buildFallbackMessage(message, relevantCars);
    await ChatHistory.create({ sessionId, role: "assistant", message: fallback, referencedCarIds });
    return { message: fallback, referencedCars: relevantCars, fallback: true };
  }
}

async function getChatHistory(sessionId) {
  return await ChatHistory.find({ sessionId }).sort({ createdAt: 1 }).populate('referencedCarIds', 'brand model year imageUrl priceNew');
}

async function deleteChatHistory(sessionId) {
  await ChatHistory.deleteMany({ sessionId });
  return { message: 'Chat history cleared' };
}

module.exports = {
  generateChatResponse,
  getChatHistory,
  deleteChatHistory
};
