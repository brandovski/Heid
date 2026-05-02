interface Props {
  value: number; // 0–100
  color?: "blue" | "red";
  className?: string;
}

export default function ProgressBar({ value, color = "blue", className = "" }: Props) {
  const pct = Math.min(Math.max(value, 0), 100);
  const track = color === "red" ? "bg-red-100" : "bg-brand-700/10";
  const fill = color === "red" ? "bg-red-500" : "bg-brand-500";

  return (
    <div className={`w-full h-1.5 rounded-full overflow-hidden ${track} ${className}`}>
      <div
        className={`h-full rounded-full ${fill}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
