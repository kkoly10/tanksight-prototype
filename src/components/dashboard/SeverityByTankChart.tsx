"use client";

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { SeverityByTank } from "@/lib/services/client-dashboard-service";
import { SEVERITY_STYLE } from "@/lib/ui/severity-styles";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

/** 100%-stacked horizontal bars showing each tank's measurement severity mix. */
export function SeverityByTankChart({ data }: { data: SeverityByTank[] }) {
  const labels = data.map((d) => d.tankNumber);
  const pct = (d: SeverityByTank, v: number) => {
    const total = d.critical + d.concern + d.monitor + d.ok;
    return total ? (v / total) * 100 : 0;
  };

  const chartData: ChartData<"bar"> = {
    labels,
    datasets: [
      { label: "OK", data: data.map((d) => pct(d, d.ok)), backgroundColor: SEVERITY_STYLE.ok.hex },
      { label: "Monitor", data: data.map((d) => pct(d, d.monitor)), backgroundColor: SEVERITY_STYLE.monitor.hex },
      { label: "Concern", data: data.map((d) => pct(d, d.concern)), backgroundColor: SEVERITY_STYLE.concern.hex },
      { label: "Critical", data: data.map((d) => pct(d, d.critical)), backgroundColor: SEVERITY_STYLE.critical.hex },
    ],
  };

  const options: ChartOptions<"bar"> = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true,
        max: 100,
        ticks: { callback: (v) => `${v}%`, color: "#64748b" },
        grid: { color: "#f1f5f9" },
      },
      y: { stacked: true, ticks: { color: "#334155" }, grid: { display: false } },
    },
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 12, color: "#475569" } },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.parsed.x).toFixed(1)}%`,
        },
      },
    },
  };

  return (
    <div style={{ height: Math.max(220, data.length * 34 + 60) }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}
