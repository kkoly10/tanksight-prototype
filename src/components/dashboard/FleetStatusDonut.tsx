"use client";

import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import type { StatusCounts } from "@/lib/services/client-dashboard-service";

ChartJS.register(ArcElement, Tooltip, Legend);

/** Fleet status distribution (healthy / monitor / action recommended). */
export function FleetStatusDonut({ counts }: { counts: StatusCounts }) {
  const total = counts.healthy + counts.monitor + counts.action_recommended;

  const data: ChartData<"doughnut"> = {
    labels: ["Healthy", "Monitor", "Action Recommended"],
    datasets: [
      {
        data: [counts.healthy, counts.monitor, counts.action_recommended],
        backgroundColor: ["#059669", "#f59e0b", "#dc2626"],
        borderWidth: 0,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, color: "#475569" } },
      tooltip: {
        callbacks: { label: (ctx) => `${ctx.label}: ${ctx.parsed} tanks` },
      },
    },
  };

  return (
    <div className="relative h-56">
      <Doughnut data={data} options={options} />
      <div className="pointer-events-none absolute inset-x-0 top-[42%] -translate-y-1/2 text-center">
        <p className="text-2xl font-semibold text-slate-900">{total}</p>
        <p className="text-[11px] uppercase tracking-wide text-slate-500">tanks</p>
      </div>
    </div>
  );
}
