export default function FamiliaLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 bg-brand-700/20 rounded-md" />
        <div className="h-9 w-32 bg-brand-700/20 rounded-lg" />
      </div>

      {/* Cards do Caixa Familiar */}
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-2xl border border-brand-700/10 p-4 space-y-2">
            <div className="h-3 w-16 bg-brand-700/10 rounded" />
            <div className="h-6 w-20 bg-brand-700/20 rounded" />
          </div>
        ))}
      </div>

      {/* Aportes */}
      <div className="bg-surface rounded-2xl border border-brand-700/10 p-5 space-y-3">
        <div className="h-4 w-32 bg-brand-700/20 rounded" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-brand-700/5 rounded-xl p-3 space-y-2">
              <div className="h-3 w-20 bg-brand-700/20 rounded" />
              <div className="h-5 w-24 bg-brand-700/20 rounded" />
              <div className="h-3 w-16 bg-brand-700/10 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Transações familiares */}
      <div className="space-y-2">
        <div className="h-4 w-36 bg-brand-700/20 rounded" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface rounded-2xl border border-brand-700/10 px-4 py-3 flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-full bg-brand-700/10 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-36 bg-brand-700/20 rounded" />
              <div className="h-3 w-20 bg-brand-700/10 rounded" />
            </div>
            <div className="h-4 w-20 bg-brand-700/20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
