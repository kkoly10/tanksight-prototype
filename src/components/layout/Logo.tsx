/** TankSight wordmark: a hexagonal tank-ring glyph + name. Inline SVG, no assets. */
export function Logo({ subdued = false }: { subdued?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        viewBox="0 0 32 32"
        className="h-7 w-7"
        role="img"
        aria-label="TankSight logo"
      >
        <polygon
          points="16,2 28,9 28,23 16,30 4,23 4,9"
          fill="none"
          stroke={subdued ? "#3b82f6" : "#60a5fa"}
          strokeWidth="2"
        />
        <circle cx="16" cy="16" r="6" fill="none" stroke="#2563eb" strokeWidth="2" />
        <circle cx="16" cy="16" r="1.6" fill="#2563eb" />
      </svg>
      <div className="leading-tight">
        <p
          className={`text-base font-semibold ${
            subdued ? "text-slate-900" : "text-white"
          }`}
        >
          TankSight
        </p>
        <p
          className={`text-[10px] uppercase tracking-wide ${
            subdued ? "text-slate-500" : "text-slate-400"
          }`}
        >
          Industrial Inspection Platform
        </p>
      </div>
    </div>
  );
}
