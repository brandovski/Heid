export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 bg-brand-700/20 rounded-md" />
        <div className="h-9 w-32 bg-brand-700/20 rounded-lg" />
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl p-4 border border-brand-700/10 space-y-2">
            <div className="h-3.5 w-20 bg-brand-700/20 rounded" />
            <div className="h-6 w-28 bg-brand-700/20 rounded" />
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="bg-surface rounded-2xl border border-brand-700/10 p-5 space-y-3">
        <div className="h-4 w-36 bg-brand-700/20 rounded" />
        <div className="h-48 bg-brand-700/10 rounded-xl" />
      </div>

      {/* Orçamento + Faturas */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-surface rounded-2xl border border-brand-700/10 p-5 space-y-3">
          <div className="h-4 w-28 bg-brand-700/20 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-3 w-24 bg-brand-700/20 rounded" />
                <div className="h-3 w-14 bg-brand-700/20 rounded" />
              </div>
              <div className="h-2 w-full bg-brand-700/10 rounded-full">
                <div
                  className="h-2 bg-brand-700/20 rounded-full"
                  style={{ width: `${30 + i * 15}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="bg-surface rounded-2xl border border-brand-700/10 p-5 space-y-3">
          <div className="h-4 w-28 bg-brand-700/20 rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-brand-700/5">
              <div className="h-4 w-32 bg-brand-700/20 rounded" />
              <div className="h-4 w-20 bg-brand-700/20 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
