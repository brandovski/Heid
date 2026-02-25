"use client";

import type { Scope } from "@/types/database";

interface ScopeSelectorProps {
  scope: Scope;
  isShared: boolean;
  onScopeChange: (scope: Scope) => void;
  onIsSharedChange: (isShared: boolean) => void;
}

export default function ScopeSelector({
  scope,
  isShared,
  onScopeChange,
  onIsSharedChange,
}: ScopeSelectorProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Escopo
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["personal", "family"] as Scope[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onScopeChange(s);
                if (s === "family") onIsSharedChange(false);
              }}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                scope === s
                  ? "bg-blue-50 border-blue-500 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s === "personal" ? "Pessoal" : "Familiar"}
            </button>
          ))}
        </div>
      </div>
      {scope === "personal" && (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isShared}
            onChange={(e) => onIsSharedChange(e.target.checked)}
            className="rounded border-gray-300 text-blue-600"
          />
          <span className="text-sm text-gray-600">
            Compartilhar com parceiro (somente leitura)
          </span>
        </label>
      )}
    </div>
  );
}
