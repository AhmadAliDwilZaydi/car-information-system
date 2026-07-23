"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ArrowLeft, Car as CarIcon, Loader2, Info, Navigation, Shield, Settings2, GaugeCircle } from "lucide-react";

export default function CarDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("teknis");

  const { data: car, isLoading, error } = useQuery({
    queryKey: ["car", id],
    queryFn: async () => {
      const res = await api.get(`/cars/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" size={48} />
      </div>
    );
  }

  if (error || !car) {
    return (
      <div className="flex min-h-screen items-center justify-center flex-col gap-4 text-slate-500">
        <CarIcon size={64} className="opacity-20" />
        <h2 className="text-2xl font-bold">Data Mobil Tidak Ditemukan</h2>
        <button onClick={() => router.back()} className="text-blue-600 hover:underline">
          Kembali ke Katalog
        </button>
      </div>
    );
  }

  const galleryUrls = toStringArray(car.imageGalleryUrls);
  const safetyFeatures = toStringArray(car.safetyFeatures);
  const entertainmentFeatures = toStringArray(car.entertainmentFeatures);

  return (
    <main className="min-h-screen bg-slate-50/50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-800">
            {car.brand} {car.model} <span className="text-slate-400 font-normal ml-2">{car.year}</span>
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image Section */}
          <div className="card overflow-hidden !p-0">
            <div className="aspect-[16/10] bg-slate-100 flex items-center justify-center relative">
              {car.imageUrl ? (
                <img 
                  src={car.imageUrl} 
                  alt={`${car.brand} ${car.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <CarIcon size={80} className="text-slate-300" />
              )}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full font-bold text-blue-700 shadow-sm border border-slate-200/50">
                Rp {car.priceNew?.toLocaleString('id-ID')}
              </div>
            </div>
            {galleryUrls.length > 0 && (
              <div className="flex gap-2 p-4 overflow-x-auto bg-slate-50">
                {galleryUrls.map((url: string, i: number) => (
                  <img key={i} src={url} alt="Gallery" className="h-20 w-32 object-cover rounded-lg border border-slate-200 shrink-0 cursor-pointer hover:opacity-80 transition-opacity" />
                ))}
              </div>
            )}
          </div>

          {/* Key Specs Summary */}
          <div className="flex flex-col justify-center">
            <h2 className="text-3xl font-extrabold text-slate-800 mb-2">{car.variant}</h2>
            <p className="text-slate-500 mb-8 flex items-center gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-semibold">{car.condition}</span>
              <span>{car.bodyType}</span>
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="card !p-4 flex items-center gap-4 bg-white border-slate-200/60 shadow-sm">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><GaugeCircle size={24}/></div>
                <div>
                  <p className="text-sm text-slate-500">Mesin</p>
                  <p className="font-bold text-slate-800">{car.engineCapacity} cc</p>
                </div>
              </div>
              <div className="card !p-4 flex items-center gap-4 bg-white border-slate-200/60 shadow-sm">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Settings2 size={24}/></div>
                <div>
                  <p className="text-sm text-slate-500">Transmisi</p>
                  <p className="font-bold text-slate-800">{car.transmissionType}</p>
                </div>
              </div>
              <div className="card !p-4 flex items-center gap-4 bg-white border-slate-200/60 shadow-sm">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Info size={24}/></div>
                <div>
                  <p className="text-sm text-slate-500">Bahan Bakar</p>
                  <p className="font-bold text-slate-800">{car.fuelType}</p>
                </div>
              </div>
              <div className="card !p-4 flex items-center gap-4 bg-white border-slate-200/60 shadow-sm">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Navigation size={24}/></div>
                <div>
                  <p className="text-sm text-slate-500">Performa</p>
                  <p className="font-bold text-slate-800">{car.horsepower} HP / {car.torque} Nm</p>
                </div>
              </div>
            </div>
            
            {car.priceUsed && (
              <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm font-semibold text-slate-500 mb-1">Estimasi Harga Bekas</p>
                <p className="text-xl font-bold text-slate-700">{formatUsedPrice(car.priceUsed)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Section */}
        <div className="card !p-0 overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50/50 overflow-x-auto">
            {[
              { id: "teknis", label: "Spesifikasi Teknis", icon: Settings2 },
              { id: "dimensi", label: "Dimensi & Kapasitas", icon: Navigation },
              { id: "fitur", label: "Fitur & Keselamatan", icon: Shield },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-blue-600 text-blue-700 bg-white"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">
            {activeTab === "teknis" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <SpecRow label="Kapasitas Mesin" value={`${car.engineCapacity} cc`} />
                <SpecRow label="Tenaga Maksimum" value={`${car.horsepower} HP`} />
                <SpecRow label="Torsi Maksimum" value={`${car.torque} Nm`} />
                <SpecRow label="Tipe Transmisi" value={car.transmissionType} />
                <SpecRow label="Jenis Bahan Bakar" value={car.fuelType} />
                <SpecRow label="Jenis Mesin / Motor" value={car.engineType || "Belum tersedia"} />
                <SpecRow label="Jumlah Silinder" value={car.cylinders === 0 ? "Motor listrik" : car.cylinders ? `${car.cylinders} silinder` : "Belum tersedia"} />
                <SpecRow label="Sistem Penggerak" value={car.drivetrain || "Belum tersedia"} />
                <SpecRow label="Kecepatan Maksimum" value={car.topSpeed ? `${car.topSpeed} km/jam` : "Belum tersedia"} />
                <SpecRow label="0–100 km/jam" value={car.acceleration ? `${car.acceleration} detik` : "Belum tersedia"} />
                {car.fuelType !== "Listrik" && <SpecRow label="Kapasitas Tangki" value={car.fuelTankCapacity ? `${car.fuelTankCapacity} liter` : "Belum tersedia"} />}
                {car.fuelType === "Listrik" && <><SpecRow label="Kapasitas Baterai" value={car.batteryCapacity ? `${car.batteryCapacity} kWh` : "Belum tersedia"} /><SpecRow label="Jarak Tempuh Listrik" value={car.electricRange ? `${car.electricRange} km` : "Belum tersedia"} /><SpecRow label="Waktu Pengisian" value={car.chargingTime || "Belum tersedia"} /></>}
              </div>
            )}

            {activeTab === "dimensi" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <SpecRow label="Panjang" value={`${car.length} mm`} />
                <SpecRow label="Lebar" value={`${car.width} mm`} />
                <SpecRow label="Tinggi" value={`${car.height} mm`} />
                <SpecRow label="Ground Clearance" value={`${car.groundClearance} mm`} />
                <SpecRow label="Kapasitas Tempat Duduk" value={`${car.seatingCapacity} Penumpang`} />
                <SpecRow label="Tipe Bodi" value={car.bodyType} />
                <SpecRow label="Wheelbase" value={car.wheelbase ? `${car.wheelbase} mm` : "Belum tersedia"} />
                <SpecRow label="Suspensi Depan" value={car.frontSuspension || "Belum tersedia"} />
                <SpecRow label="Suspensi Belakang" value={car.rearSuspension || "Belum tersedia"} />
                <SpecRow label="Sistem Pengereman" value={car.brakeType || "Belum tersedia"} />
                <SpecRow label="Ukuran Ban" value={car.tireSize || "Belum tersedia"} />
                <SpecRow label="Garansi" value={car.warranty || "Belum tersedia"} />
              </div>
            )}

            {activeTab === "fitur" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Shield size={20} className="text-green-600"/> Fitur Keselamatan
                  </h3>
                  <ul className="space-y-3">
                    {safetyFeatures.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700">
                        <span className="mt-1 w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                        {f}
                      </li>
                    ))}
                    {safetyFeatures.length === 0 && (
                      <li className="text-slate-400 italic">Tidak ada data</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Info size={20} className="text-blue-600"/> Hiburan & Kenyamanan
                  </h3>
                  <ul className="space-y-3">
                    {entertainmentFeatures.map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700">
                        <span className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                        {f}
                      </li>
                    ))}
                    {entertainmentFeatures.length === 0 && (
                      <li className="text-slate-400 italic">Tidak ada data</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function SpecRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3">
      <span className="text-slate-500 mb-1 sm:mb-0">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function formatUsedPrice(value: string) {
  const numbers = value.match(/\d+/g);
  if (!numbers?.length) return `Rp ${value}`;
  return numbers.map((number) => `Rp ${Number(number).toLocaleString("id-ID")}`).join(" – ");
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [];
}
