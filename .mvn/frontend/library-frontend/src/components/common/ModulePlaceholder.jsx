const ModulePlaceholder = ({ title }) => (
  <section className="min-h-[60vh] rounded-2xl border border-indigo-100 bg-white p-8 shadow-sm">
    <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-indigo-600">
      Giai đoạn mở rộng
    </p>
    <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
    <p className="mt-3 max-w-2xl text-slate-600">
      Giao diện cho module này sẽ được kết nối với backend ở giai đoạn tiếp theo.
    </p>
  </section>
);

export default ModulePlaceholder;
