export default function TransacoesLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 animate-pulse">
      {/* Header + filtros */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-32 bg-gray-200 rounded-md" />
        <div className="h-9 w-36 bg-gray-200 rounded-lg" />
      </div>

      {/* Barra de filtros */}
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-100 rounded-full" />
        ))}
      </div>

      {/* Lista de transações */}
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3"
          >
            <div className="h-9 w-9 rounded-full bg-gray-100 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-40 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
            <div className="text-right space-y-1.5">
              <div className="h-3.5 w-20 bg-gray-200 rounded ml-auto" />
              <div className="h-5 w-16 bg-gray-100 rounded-full ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
