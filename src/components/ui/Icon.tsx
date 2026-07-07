export type IconName =
  | "tank"
  | "building"
  | "alert"
  | "document"
  | "ruler"
  | "flag"
  | "clock"
  | "gauge"
  | "check"
  | "trend"
  | "robot"
  | "location";

const PATHS: Record<IconName, React.ReactNode> = {
  tank: <path d="M5 8c0-2 3-3 7-3s7 1 7 3v9c0 2-3 3-7 3s-7-1-7-3zM5 8c0 2 3 3 7 3s7-1 7-3" />,
  building: <path d="M4 21V5l8-2v18M12 21V9l8 2v10M4 21h16M8 8v.01M8 12v.01M8 16v.01" />,
  alert: <path d="M12 3l9 16H3zM12 10v4M12 17v.01" />,
  document: <path d="M6 2h9l5 5v15H6zM14 2v6h6M9 13h6M9 17h6" />,
  ruler: <path d="M3 8l5-5 13 13-5 5zM8 8l2 2M11 5l2 2M6 11l2 2" />,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  clock: <path d="M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  gauge: <path d="M12 13l4-3M3 18a9 9 0 1118 0" />,
  check: <path d="M20 7L10 17l-5-5" />,
  trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  robot: <path d="M12 2v3M7 8h10a2 2 0 012 2v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7a2 2 0 012-2zM9 13v.01M15 13v.01M9 17h6" />,
  location: <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12zM12 9a2 2 0 100 4 2 2 0 000-4z" />,
};

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}
