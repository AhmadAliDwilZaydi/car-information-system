"use client";

import { useState } from "react";
import { UploadCloud, Download, FileJson } from "lucide-react";
import toast from "react-hot-toast";

export default function BulkDataPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = () => {
    toast.error("Fitur ini sedang dalam pengembangan.");
  };

  const handleExport = () => {
    toast.error("Fitur ini sedang dalam pengembangan.");
  };

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Bulk Import / Export</h2>
        <p className="text-slate-500">Kelola data kendaraan secara massal (JSON format).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card text-center p-8 border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors group">
          <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Import Data (JSON)</h3>
          <p className="text-slate-500 text-sm mb-6">Unggah file cars.seed.json untuk menambahkan banyak data kendaraan sekaligus.</p>
          <button 
            onClick={handleImport}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all w-full"
          >
            Pilih File JSON
          </button>
        </div>

        <div className="card text-center p-8 border border-slate-200">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
            <Download size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Export Data (JSON)</h3>
          <p className="text-slate-500 text-sm mb-6">Unduh seluruh data kendaraan yang ada di database ke dalam format JSON.</p>
          <button 
            onClick={handleExport}
            className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all w-full flex justify-center items-center gap-2"
          >
            <FileJson size={18} /> Download JSON
          </button>
        </div>
      </div>
    </div>
  );
}
