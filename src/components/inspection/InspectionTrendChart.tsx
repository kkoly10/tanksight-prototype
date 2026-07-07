"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { TrendPoint } from "@/lib/types";
import { PROTOTYPE_MIN_RETIREMENT_THICKNESS_INCHES } from "@/lib/domain/inspection-metrics";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
);

export function InspectionTrendChart({ trendData }: { trendData: TrendPoint[] }) {
  const labels = trendData.map((p) => String(new Date(p.inspectedAt).getUTCFullYear()));
  const retirement = PROTOTYPE_MIN_RETIREMENT_THICKNESS_INCHES;

  const data: ChartData<"line"> = {
    labels,
    datasets: [
      {
        label: "Min thickness",
        data: trendData.map((p) => p.minThickness),
        borderColor: "#dc2626",
        backgroundColor: "rgba(220,38,38,0.08)",
        fill: true,
        tension: 0.25,
        pointRadius: 4,
        pointBackgroundColor: "#dc2626",
      },
      {
        label: "Avg thickness",
        data: trendData.map((p) => p.avgThickness),
        borderColor: "#1d4ed8",
        backgroundColor: "rgba(29,78,216,0.06)",
        fill: false,
        tension: 0.25,
        pointRadius: 4,
        pointBackgroundColor: "#1d4ed8",
      },
      {
        label: "Retirement limit",
        data: trendData.map(() => retirement),
        borderColor: "#94a3b8",
        borderDash: [6, 5],
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    scales: {
      y: {
        title: { display: true, text: "Thickness (in)" },
        suggestedMin: 0.08,
        suggestedMax: 0.26,
        ticks: {
          callback: (v) => Number(v).toFixed(2),
          color: "#64748b",
        },
        grid: { color: "#f1f5f9" },
      },
      x: {
        ticks: { color: "#64748b" },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, color: "#475569" } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.parsed.y).toFixed(3)} in`,
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  );
}
