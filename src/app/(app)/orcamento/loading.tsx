export default function OrcamentoLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-36 bg-gray-200 rounded-md" />
        <div className="h-9 w-32 bg-gray-200 rounded-lg" />
      </div>

      {/* Resumo */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex gap-4 justify-between">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="h-5 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Categorias */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-5 py-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-100" />
                <div className="h-3.5 w-28 bg-gray-200 rounded" />
              </div>
              <div className="text-right space-y-1">
                <div className="h-3 w-20 bg-gray-200 rounded ml-auto" />
                <div className="h-2.5 w-14 bg-gray-100 rounded ml-auto" />
              </div>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full">
              <div
                className="h-2 bg-gray-200 rounded-full"
                style={{ width: `${20 + i * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
