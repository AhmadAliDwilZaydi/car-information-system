"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { DashboardResponse } from "@/types";
import StatCard from "@/components/stat-card";
import { CarFront, Building2, LayoutGrid, PackagePlus } from "lucide-react";
import SimpleChart from "@/components/simple-chart";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get<DashboardResponse>("/dashboard")).data
  });

  if (isLoading) {
    return <div className="card">Loading dashboard...</div>;
  }

  const chartPoints = data?.bodyTypeDistribution?.map((item) => ({
    label: item.type || "Unknown",
    value: item.count
  })) || [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Mobil" value={data?.totalCars || 0} icon={<CarFront className="h-4 w-4" />} />
        <StatCard title="Total Merek" value={data?.totalBrands || 0} icon={<Building2 className="h-4 w-4" />} />
        <StatCard title="Total Model" value={data?.totalModels || 0} icon={<LayoutGrid className="h-4 w-4" />} />
        <StatCard title="Ditambahkan Bulan Ini" value={data?.carsAddedThisMonth || 0} icon={<PackagePlus className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SimpleChart
          title="Distribusi Tipe Bodi Mobil"
          points={chartPoints}
        />

        <SimpleChart
          title="Distribusi Rentang Harga"
          points={(data?.priceDistribution || []).map((item) => ({ label: item.range, value: item.count }))}
        />

        <section className="card">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Quick Action</h3>
          <div className="grid gap-3 sm:grid-cols-1">
            <a href="/cars/add" className="rounded-xl bg-blue-600 px-3 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700">
              Tambah Spesifikasi Mobil Baru
            </a>
          </div>
        </section>
      </div>

      <section className="card overflow-x-auto">
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Mobil Terbaru Ditambahkan</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="pb-2">Merek</th>
              <th className="pb-2">Model</th>
              <th className="pb-2">Tahun</th>
              <th className="pb-2">Tipe Bodi</th>
              <th className="pb-2">Harga Baru</th>
            </tr>
          </thead>
          <tbody>
            {data?.latestCars?.map((car) => (
              <tr key={car._id} className="border-b border-slate-100">
                <td className="py-2 font-medium">{car.brand}</td>
                <td className="py-2">{car.model}</td>
                <td className="py-2">{car.year}</td>
                <td className="py-2">{car.bodyType}</td>
                <td className="py-2">Rp {Number(car.priceNew).toLocaleString("id-ID")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
