import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: "accent" | "success" | "warning";
}

const colorMap = {
  accent: "var(--color-accent)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
};

export function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `color-mix(in srgb, ${colorMap[color]} 15%, transparent)` }}
        >
          <Icon className="w-4 h-4" style={{ color: colorMap[color] }} />
        </div>
      </div>
      <p className="text-2xl font-semibold font-mono" style={{ color: colorMap[color] }}>
        {value}
      </p>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">{label}</p>
    </div>
  );
}
