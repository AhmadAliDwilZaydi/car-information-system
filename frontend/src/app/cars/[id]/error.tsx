"use client";

import Link from "next/link";

export default function DetailError({ reset }: { reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center p-6"><section className="card max-w-md text-center"><h1 className="text-xl font-bold">Detail mobil belum dapat dimuat</h1><p className="mt-2 text-sm text-slate-500">Silakan kembali ke katalog atau coba muat ulang detail ini.</p><div className="mt-5 flex justify-center gap-3"><button onClick={reset} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white">Coba lagi</button><Link href="/" className="rounded-lg border px-4 py-2 font-semibold">Katalog</Link></div></section></main>;
}
