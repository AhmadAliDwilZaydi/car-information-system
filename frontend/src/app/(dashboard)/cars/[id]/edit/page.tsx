"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

const textFields = [
  ["brand", "Merek"], ["model", "Model"], ["year", "Tahun"], ["bodyType", "Tipe bodi"], ["variant", "Varian / trim"],
  ["engineCapacity", "Kapasitas mesin (cc)"], ["horsepower", "Tenaga (HP)"], ["torque", "Torsi (Nm)"],
  ["length", "Panjang (mm)"], ["width", "Lebar (mm)"], ["height", "Tinggi (mm)"], ["groundClearance", "Ground clearance (mm)"],
  ["seatingCapacity", "Kapasitas kursi"], ["priceNew", "Harga baru (Rp)"], ["priceUsed", "Harga bekas"],
] as const;

export default function EditCarPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<Record<string, unknown> | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    api.get(`/cars/${id}`).then(({ data }) => setForm({
      ...data,
      safetyFeatures: (data.safetyFeatures || []).join(", "),
      entertainmentFeatures: (data.entertainmentFeatures || []).join(", "),
    })).catch(() => toast.error("Data mobil tidak ditemukan"));
  }, [id]);

  const update = (key: string, value: string) => setForm((current) => current ? { ...current, [key]: value } : current);
  const chooseImage = (file: File | null) => {
    setImage(file);
    setPreview((current) => { if (current) URL.revokeObjectURL(current); return file ? URL.createObjectURL(file) : null; });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form) return;
    try {
      const body = new FormData();
      textFields.forEach(([key]) => body.append(key, String(form[key] ?? "")));
      ["transmissionType", "fuelType", "condition"].forEach((key) => body.append(key, String(form[key] ?? "")));
      ["safetyFeatures", "entertainmentFeatures"].forEach((key) => String(form[key] ?? "").split(",").map((item) => item.trim()).filter(Boolean).forEach((item) => body.append(key, item)));
      if (image) body.append("image", image);
      await api.put(`/cars/${id}`, body, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Spesifikasi mobil diperbarui");
      router.push("/cars");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal memperbarui mobil");
    }
  };

  if (!form) return <div className="card">Memuat data mobil...</div>;

  return (
    <form onSubmit={submit} className="mx-auto max-w-4xl space-y-5">
      <h2 className="text-2xl font-bold">Edit Spesifikasi Mobil</h2>
      <section className="card grid gap-4 md:grid-cols-2">
        {textFields.map(([key, label]) => <label key={key} className="text-sm font-medium text-slate-700">{label}<input type={key === "year" || key === "priceNew" || ["engineCapacity", "horsepower", "torque", "length", "width", "height", "groundClearance", "seatingCapacity"].includes(key) ? "number" : "text"} value={String(form[key] ?? "")} onChange={(e) => update(key, e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>)}
        <label className="text-sm font-medium text-slate-700">Transmisi<select value={String(form.transmissionType ?? "Automatic")} onChange={(e) => update("transmissionType", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"><option>Manual</option><option>Automatic</option><option>CVT</option><option>DCT</option><option>AMT</option></select></label>
        <label className="text-sm font-medium text-slate-700">Bahan bakar<select value={String(form.fuelType ?? "Bensin")} onChange={(e) => update("fuelType", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"><option>Bensin</option><option>Diesel</option><option>Hybrid</option><option>Listrik</option></select></label>
        <label className="text-sm font-medium text-slate-700">Kondisi<select value={String(form.condition ?? "Baru & Bekas")} onChange={(e) => update("condition", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"><option>Baru</option><option>Bekas</option><option>Baru & Bekas</option></select></label>
      </section>
      <section className="card space-y-4"><label className="block text-sm font-medium text-slate-700">Fitur keselamatan (pisahkan koma)<textarea value={String(form.safetyFeatures ?? "")} onChange={(e) => update("safetyFeatures", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" rows={2} /></label><label className="block text-sm font-medium text-slate-700">Fitur hiburan (pisahkan koma)<textarea value={String(form.entertainmentFeatures ?? "")} onChange={(e) => update("entertainmentFeatures", e.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" rows={2} /></label></section>
      <section className="card space-y-3"><h3 className="font-semibold">Gambar utama (MinIO)</h3>{preview || form.imageUrl ? <img src={preview || String(form.imageUrl)} alt="Preview mobil" className="h-44 w-72 rounded-xl object-cover" /> : null}<input type="file" accept="image/*" onChange={(e) => chooseImage(e.target.files?.[0] || null)} /><p className="text-xs text-slate-500">File baru akan mengganti seluruh galeri lama dan disimpan dengan nama object standar.</p></section>
      <button className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">Simpan Perubahan</button>
    </form>
  );
}
