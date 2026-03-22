interface InfoCardProps {
  label: string;
  value: string;
  highlighted?: boolean;
  colorVariant?: "income" | "expense" | "neutral";
}

export default function InfoCard({
  label,
  value,
  highlighted = false,
  colorVariant = "neutral",
}: InfoCardProps) {
  const valueColor =
    colorVariant === "income"
      ? "text-brand-700"
      : colorVariant === "expense"
        ? "text-danger-700"
        : "text-brand-700";

  return (
    <div
      className={`rounded-card border p-3 flex flex-col gap-1 ${
        highlighted ? "bg-card-highlight border-brand" : "bg-surface border-brand"
      }`}
    >
      <span className="text-[12px] text-brand-700/60 leading-none">{label}</span>
      <span className={`text-[18px] font-medium leading-tight ${valueColor}`}>
        {value}
      </span>
    </div>
  );
}
