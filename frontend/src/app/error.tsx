"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center p-6"><section className="card max-w-md text-center"><h1 className="text-xl font-bold">Halaman belum dapat dimuat</h1><p className="mt-2 text-sm text-slate-500">Koneksi sedang bermasalah. Data dan filter Anda tidak dihapus.</p><button onClick={reset} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">Muat ulang halaman</button></section></main>;
}
