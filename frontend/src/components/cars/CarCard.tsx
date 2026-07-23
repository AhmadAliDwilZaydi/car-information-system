import Link from "next/link";
import { Car } from "lucide-react";

export default function CarCard({ car }: { car: any }) {
  return (
    <div className="card group relative flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-100">
        {car.imageUrl ? (
          <img
            src={car.imageUrl}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Car size={48} />
          </div>
        )}
        <div className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-blue-600 backdrop-blur-sm shadow-sm">
          {car.year}
        </div>
      </div>
      
      <div className="mt-4 flex flex-1 flex-col">
        <h3 className="text-lg font-bold text-slate-800">
          {car.brand} {car.model}
        </h3>
        <p className="text-sm text-slate-500 mb-3">{car.variant || car.bodyType}</p>
        
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-4">
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
            <span className="font-medium">{car.transmissionType}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
            <span className="font-medium">{car.fuelType}</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
            <span className="font-medium">{car.engineCapacity} cc</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
            <span className="font-medium">{car.bodyType}</span>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="text-xs text-slate-500 block">Harga Baru</span>
            <span className="text-lg font-bold text-blue-700">
              Rp {car.priceNew.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
      {car?._id && <Link href={`/cars/${encodeURIComponent(car._id)}`} className="absolute inset-0" prefetch={false}><span className="sr-only">Lihat detail {car.brand} {car.model}</span></Link>}
    </div>
  );
}
