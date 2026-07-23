import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const carSchema = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().min(1900),
  bodyType: z.string().min(1),
  variant: z.string().optional(),
  engineCapacity: z.number().min(0),
  horsepower: z.number().min(0),
  torque: z.number().min(0),
  transmissionType: z.string().min(1),
  fuelType: z.string().min(1),
  length: z.number().min(1),
  width: z.number().min(1),
  height: z.number().min(1),
  groundClearance: z.number().min(1),
  seatingCapacity: z.number().min(1),
  priceNew: z.number().min(1),
  priceUsed: z.string().optional(),
  condition: z.enum(["Baru", "Bekas", "Baru & Bekas"]),
  safetyFeatures: z.string().optional(),
  entertainmentFeatures: z.string().optional()
});
