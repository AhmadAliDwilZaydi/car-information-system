type Point = {
  label: string;
  value: number;
};

type Props = {
  title: string;
  points: Point[];
};

export default function SimpleChart({ title, points }: Props) {
  const max = Math.max(...points.map((p) => p.value), 1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-slate-700">{title}</h3>
      <div className="space-y-3">
        {points.map((point) => (
          <div key={point.label}>
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>{point.label}</span>
              <span>{point.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                style={{ width: `${(point.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
