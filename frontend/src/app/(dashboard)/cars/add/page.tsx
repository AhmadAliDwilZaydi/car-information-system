"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { carSchema } from "@/lib/schemas";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

type CarForm = z.infer<typeof carSchema>;

const defaults: CarForm = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  bodyType: "",
  variant: "",
  engineCapacity: 0,
  horsepower: 0,
  torque: 0,
  transmissionType: "Automatic",
  fuelType: "",
  length: 0,
  width: 0,
  height: 0,
  groundClearance: 0,
  seatingCapacity: 5,
  priceNew: 0,
  priceUsed: "",
  condition: "Baru & Bekas",
  safetyFeatures: "",
  entertainmentFeatures: ""
};

export default function AddCarPage() {
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onImageChange = (file: File | null) => {
    setImage(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<CarForm>({
    resolver: zodResolver(carSchema),
    defaultValues: defaults
  });

  const onSubmit = async (values: CarForm) => {
    try {
      const form = new FormData();
      
      // Convert arrays for features
      const payload = {
        ...values,
        safetyFeatures: values.safetyFeatures ? String(values.safetyFeatures).split(',').map(s => s.trim()) : [],
        entertainmentFeatures: values.entertainmentFeatures ? String(values.entertainmentFeatures).split(',').map(s => s.trim()) : []
      };

      Object.entries(payload).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => form.append(key, String(v)));
        } else {
          form.append(key, String(value ?? ""));
        }
      });

      if (image) {
        form.append("image", image);
      }

      await api.post("/cars", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Spesifikasi mobil berhasil ditambahkan");
      router.push("/cars");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Gagal menambahkan mobil");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/cars" className="p-2 rounded-full hover:bg-slate-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-slate-800">Tambah Spesifikasi Mobil Baru</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Identitas Kendaraan */}
        <section className="card space-y-4">
          <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Identitas Kendaraan</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Merek</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Contoh: Toyota" {...register("brand")} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Model</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Contoh: Avanza" {...register("model")} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Tahun</label>
              <input type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="2024" {...register("year", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Tipe Bodi</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Contoh: MPV, SUV" {...register("bodyType")} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-1">Varian / Trim (Opsional)</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Contoh: 1.5 G TSS" {...register("variant")} />
            </div>
          </div>
        </section>

        {/* Spesifikasi Teknis */}
        <section className="card space-y-4">
          <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Spesifikasi Teknis</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Kapasitas Mesin (cc)</label>
              <input type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2" {...register("engineCapacity", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Tenaga Maksimum (HP)</label>
              <input type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2" {...register("horsepower", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Torsi Maksimum (Nm)</label>
              <input type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2" {...register("torque", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Transmisi</label>
              <select className="w-full rounded-xl border border-slate-300 px-3 py-2" {...register("transmissionType")}>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
                <option value="CVT">CVT</option>
                <option value="DCT">DCT</option>
                <option value="AMT">AMT</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-1">Bahan Bakar</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Bensin, Diesel, Hybrid, Listrik" {...register("fuelType")} />
            </div>
          </div>
        </section>

        {/* Dimensi */}
        <section className="card space-y-4">
          <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Dimensi Kendaraan</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Panjang (mm)</label>
              <input type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2" {...register("length", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Lebar (mm)</label>
              <input type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2" {...register("width", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Tinggi (mm)</label>
              <input type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2" {...register("height", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">G. Clearance (mm)</label>
              <input type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2" {...register("groundClearance", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Kapasitas Penumpang</label>
              <input type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2" {...register("seatingCapacity", { valueAsNumber: true })} />
            </div>
          </div>
        </section>

        {/* Fitur & Harga */}
        <section className="card space-y-4">
          <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Fitur & Harga</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-1">Fitur Keselamatan (pisahkan dengan koma)</label>
              <textarea className="w-full rounded-xl border border-slate-300 px-3 py-2" rows={2} placeholder="Contoh: ABS, EBD, 6 Airbags" {...register("safetyFeatures")} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-1">Fitur Hiburan (pisahkan dengan koma)</label>
              <textarea className="w-full rounded-xl border border-slate-300 px-3 py-2" rows={2} placeholder="Contoh: 9 inch Touchscreen, Android Auto" {...register("entertainmentFeatures")} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Harga Baru (Rp)</label>
              <input type="number" className="w-full rounded-xl border border-slate-300 px-3 py-2" {...register("priceNew", { valueAsNumber: true })} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Harga Bekas (Opsional)</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Contoh: 150 Juta - 200 Juta" {...register("priceUsed")} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Kondisi Pasar</label>
              <select className="w-full rounded-xl border border-slate-300 px-3 py-2" {...register("condition")}>
                <option value="Baru">Baru</option>
                <option value="Bekas">Bekas</option>
                <option value="Baru & Bekas">Baru & Bekas</option>
              </select>
            </div>
          </div>
        </section>

        {/* Media */}
        <section className="card space-y-4">
          <h3 className="font-semibold text-lg text-slate-800 border-b pb-2">Foto Utama (MinIO)</h3>
          <div className="space-y-3">
            {preview ? (
              <img src={preview} alt="Preview" className="h-64 w-full md:w-2/3 object-cover rounded-xl border border-slate-200 shadow-sm" />
            ) : (
              <div className="flex h-64 w-full md:w-2/3 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400">
                Belum ada foto eksterior (front three-quarter disarankan)
              </div>
            )}
            <div>
              <input type="file" accept="image/*" onChange={(e) => onImageChange(e.target.files?.[0] || null)} className="text-sm" />
              <p className="text-xs text-slate-500 mt-1">Sistem akan menamai file secara otomatis sesuai standar: brand_model_tahun_front34_01.jpg</p>
            </div>
          </div>
        </section>

        {Object.keys(errors).length > 0 && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
            Pastikan seluruh data wajib (seperti Identitas, Spesifikasi, Dimensi, Harga) telah diisi dengan benar.
          </div>
        )}
        
        <button disabled={isSubmitting} className="flex w-full md:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-bold text-white shadow-lg hover:bg-blue-700 disabled:opacity-60 transition-all hover:scale-105">
          <Save size={20} />
          {isSubmitting ? "Menyimpan ke Database..." : "Simpan Spesifikasi"}
        </button>
      </form>
    </div>
  );
}
