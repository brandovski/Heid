export default function InvestimentosLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 bg-gray-200 rounded-md" />
        <div className="h-9 w-36 bg-gray-200 rounded-lg" />
      </div>

      {/* Banner de aportes */}
      <div className="h-12 w-full bg-amber-50 rounded-2xl border border-amber-100" />

      {/* Cards de investimentos */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
              <div className="h-6 w-16 bg-gray-100 rounded-full" />
            </div>
            <div className="flex gap-4">
              <div className="space-y-1">
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-5 w-24 bg-gray-200 rounded" />
              </div>
              <div className="space-y-1">
                <div className="h-3 w-16 bg-gray-100 rounded" />
                <div className="h-5 w-24 bg-gray-200 rounded" />
              </div>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full">
              <div
                className="h-1.5 bg-gray-200 rounded-full"
                style={{ width: `${25 + i * 18}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
