"use client";

import toast from "react-hot-toast";

export default function SettingsPage() {
  return (
    <div className="card space-y-4">
      <h2 className="text-lg font-bold">Settings</h2>
      <div className="rounded-xl border border-slate-200 p-4">
        <p className="text-sm text-slate-600">Pengaturan tema dan notifikasi dapat dikembangkan lebih lanjut sesuai kebutuhan bisnis.</p>
      </div>
      <button onClick={() => toast.success("Pengaturan disimpan")} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Save Settings</button>
    </div>
  );
}
