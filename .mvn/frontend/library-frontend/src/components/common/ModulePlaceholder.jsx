export default function ModulePlaceholder({ title, description = "Tính năng này đang được hoàn thiện và sẽ sớm sẵn sàng." }) {
  return <section className="min-h-64 rounded-2xl border border-indigo-100 bg-white p-8 shadow-sm">
    <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
    <p className="mt-3 max-w-2xl text-slate-600">{description}</p>
  </section>;
}
