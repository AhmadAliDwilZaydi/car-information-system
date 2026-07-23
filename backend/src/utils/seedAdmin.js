const bcrypt = require("bcryptjs");
const connectDatabase = require("../config/db");
const env = require("../config/env");
const Admin = require("../models/Admin");

async function seedAdmin() {
  await connectDatabase();

  const existing = await Admin.findOne({ email: env.adminEmail.toLowerCase() });
  if (existing) {
    console.log("Admin already exists");
    process.exit(0);
  }

  const password = await bcrypt.hash(env.adminPassword, 10);
  await Admin.create({
    name: "Administrator",
    email: env.adminEmail.toLowerCase(),
    password,
    role: "Admin"
  });

  console.log("Admin seeded");
  process.exit(0);
}

seedAdmin().catch((error) => {
  console.error(error);
  process.exit(1);
});
