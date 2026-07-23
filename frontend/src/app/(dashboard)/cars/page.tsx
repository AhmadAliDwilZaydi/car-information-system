"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Car } from "@/types";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

type CarListResponse = {
  items: Car[];
  meta: { page: number; totalPages: number; total: number };
};

export default function CarsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cars", search, page],
    queryFn: async () =>
      (
        await api.get<CarListResponse>("/cars", {
          params: { search, page, limit: 10 }
        })
      ).data
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/cars/${id}`),
    onSuccess: () => {
      toast.success("Data mobil dihapus");
      queryClient.invalidateQueries({ queryKey: ["cars"] });
    },
    onError: () => toast.error("Gagal menghapus")
  });

  const onDelete = (id: string) => {
    if (confirm("Hapus spesifikasi mobil ini?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari merek / model..." className="w-full max-w-md rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <Link href="/cars/add" className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Tambah Mobil</Link>
      </div>

      {isLoading ? (
        <div className="card text-center py-12 text-slate-500">Loading data mobil...</div>
      ) : (
        <>
          <section className="card overflow-x-auto !p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                  <th className="px-4 py-3 font-semibold">Foto</th>
                  <th className="px-4 py-3 font-semibold">Kendaraan</th>
                  <th className="px-4 py-3 font-semibold">Tipe Bodi</th>
                  <th className="px-4 py-3 font-semibold">Performa</th>
                  <th className="px-4 py-3 font-semibold">Harga Baru</th>
                  <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.items.map((car) => (
                  <tr key={car._id} className="group hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="h-12 w-20 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                        {car.imageUrl ? (
                          <img src={car.imageUrl} alt={car.model} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-400">No Img</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{car.brand} {car.model}</div>
                      <div className="text-xs text-slate-500">{car.variant} • {car.year}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{car.bodyType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-600">{car.engineCapacity}cc • {car.transmissionType}</div>
                      <div className="text-xs text-slate-500">{car.horsepower}HP / {car.torque}Nm</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-700">
                      Rp {Number(car.priceNew).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/cars/${car._id}/edit`} className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</Link>
                        <button onClick={() => onDelete(car._id)} className="rounded border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data?.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">Tidak ada data mobil.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <div className="flex items-center justify-between text-sm font-medium text-slate-600">
            <p>Menampilkan total {data?.meta.total || 0} kendaraan</p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 hover:bg-slate-50 disabled:opacity-50">Prev</button>
              <span className="flex items-center px-2">Page {page} of {data?.meta.totalPages || 1}</span>
              <button disabled={page >= (data?.meta.totalPages || 1)} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 hover:bg-slate-50 disabled:opacity-50">Next</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
