import CarCatalog from "../components/cars/CarCatalog";

export const metadata = {
  title: "Car Information System",
  description: "Eksplorasi database referensi kendaraan terbesar dengan spesifikasi mendalam.",
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50/50">
      <CarCatalog />
    </main>
  );
}
