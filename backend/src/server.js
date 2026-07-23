const app = require("./app");
const env = require("./config/env");
const connectDatabase = require("./config/db");
const { ensureBucket } = require("./config/minio");
const Admin = require("./models/Admin");
const bcrypt = require("bcryptjs");
const { seedCarsIfEmpty } = require("./utils/seeder");

async function bootstrap() {
  await connectDatabase();

  await ensureBucket();
  console.log("MinIO bucket ready");
  await seedCarsIfEmpty();

  let existing = await Admin.findOne({ email: env.adminEmail.toLowerCase() });
  if (!existing) {
    const legacyAdmin = await Admin.findOne({ email: "admin@carrental.local" });
    if (legacyAdmin) {
      legacyAdmin.email = env.adminEmail.toLowerCase();
      await legacyAdmin.save();
      existing = legacyAdmin;
      console.log("Legacy admin identity migrated to Car Information System");
    }
  }
  if (!existing) {
    const hashedPassword = await bcrypt.hash(env.adminPassword, 10);
    await Admin.create({
      name: "Administrator",
      email: env.adminEmail.toLowerCase(),
      password: hashedPassword,
      role: "Admin"
    });
    console.log("Default admin created");
  }

  app.listen(env.port, () => {
    console.log(`API running at http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
