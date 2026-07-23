export type ApiMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Car = {
  _id: string;
  brand: string;
  model: string;
  year: number;
  bodyType: string;
  variant?: string;
  engineCapacity: number;
  horsepower: number;
  torque: number;
  transmissionType: string;
  fuelType: string;
  engineType?: string;
  cylinders?: number;
  drivetrain?: string;
  fuelTankCapacity?: number;
  batteryCapacity?: number;
  electricRange?: number;
  chargingTime?: string;
  topSpeed?: number;
  acceleration?: number;
  length: number;
  width: number;
  height: number;
  groundClearance: number;
  seatingCapacity: number;
  wheelbase?: number;
  frontSuspension?: string;
  rearSuspension?: string;
  brakeType?: string;
  tireSize?: string;
  safetyFeatures: string[];
  entertainmentFeatures: string[];
  priceNew: number;
  priceUsed?: string;
  condition: string;
  warranty?: string;
  imageUrl?: string;
  imageGalleryUrls?: string[];
  createdAt: string;
  updatedAt: string;
};

export type DashboardResponse = {
  totalCars: number;
  totalBrands: number;
  totalModels: number;
  carsAddedThisMonth: number;
  bodyTypeDistribution: { type: string; count: number }[];
  priceDistribution: { range: string; count: number }[];
  latestCars: Car[];
};
