import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { ReportData, Severity } from "@/lib/types";
import { REGION_LABELS } from "@/lib/domain/region";
import {
  formatDate,
  formatInches,
  formatPercent,
  formatYears,
  SEVERITY_LABELS,
  STATUS_LABELS,
} from "@/lib/domain/formatting";
import { SEVERITY_STYLE } from "@/lib/ui/severity-styles";

/**
 * API 653-style PDF report. Renders entirely from ReportData — the exact same
 * object the web preview uses — so the two never disagree. @react-pdf/renderer
 * lays this out to a real multi-page PDF with a repeating footer + page numbers.
 */

const BRAND = "#1d4ed8";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";

const styles = StyleSheet.create({
  page: {
    paddingTop: 42,
    paddingBottom: 54,
    paddingHorizontal: 44,
    fontSize: 9,
    color: INK,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    paddingBottom: 10,
    marginBottom: 14,
  },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: BRAND },
  brandSub: { fontSize: 8, color: MUTED, marginTop: 2 },
  reportTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", textAlign: "right" },
  reportMeta: { fontSize: 8, color: MUTED, textAlign: "right", marginTop: 2 },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 6,
    marginTop: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailGrid: { flexDirection: "row", flexWrap: "wrap" },
  detailItem: { width: "33%", marginBottom: 6 },
  detailLabel: { fontSize: 7, color: MUTED, textTransform: "uppercase" },
  detailValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  paragraph: { fontSize: 9, marginBottom: 4 },
  metricsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  metricBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 4,
    padding: 8,
  },
  metricValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  metricLabel: { fontSize: 7, color: MUTED, textTransform: "uppercase" },
  table: { borderWidth: 1, borderColor: LINE, borderRadius: 4, marginTop: 4 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE },
  trLast: { flexDirection: "row" },
  th: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    textTransform: "uppercase",
    padding: 5,
  },
  td: { fontSize: 8, padding: 5 },
  findingItem: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 8,
  },
  findingTitle: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  findingBody: { fontSize: 8, color: "#334155", marginTop: 1 },
  chip: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 3,
  },
  barTrack: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#f1f5f9",
    marginTop: 2,
  },
  disclaimer: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    borderRadius: 4,
    padding: 8,
    fontSize: 7.5,
    color: "#92400e",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 6,
    fontSize: 7,
    color: MUTED,
  },
});

function sevHex(s: Severity) {
  return SEVERITY_STYLE[s].hex;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function InspectionReportDocument({ data }: { data: ReportData }) {
  const { client, site, tank, currentRun, previousRun, metrics, regionSummaries, findings, trendData, executiveSummary } =
    data;

  const current = trendData.find((t) => t.inspectedAt === currentRun.inspectedAt);
  const previous = previousRun
    ? trendData.find((t) => t.inspectedAt === previousRun.inspectedAt)
    : undefined;

  return (
    <Document
      title={`${tank.tankNumber} Inspection Report`}
      author="TankSight"
      subject={`API 653 tank floor inspection report for ${tank.tankNumber}`}
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow} fixed>
          <View>
            <Text style={styles.brand}>TankSight</Text>
            <Text style={styles.brandSub}>Industrial Inspection Platform</Text>
          </View>
          <View>
            <Text style={styles.reportTitle}>API 653 Tank Inspection Report</Text>
            <Text style={styles.reportMeta}>Report No. {data.reportNumber}</Text>
            <Text style={styles.reportMeta}>Generated {data.generatedAt}</Text>
          </View>
        </View>

        {/* Details */}
        <Text style={styles.sectionTitle}>1. Inspection Details</Text>
        <View style={styles.detailGrid}>
          <Detail label="Client" value={client.name} />
          <Detail label="Site" value={site.name} />
          <Detail label="Location" value={site.location} />
          <Detail label="Tank" value={tank.tankNumber} />
          <Detail label="Product" value={tank.product} />
          <Detail label="Diameter" value={`${tank.diameterFeet} ft`} />
          <Detail label="Nominal Thickness" value={formatInches(tank.nominalThicknessInches)} />
          <Detail label="Inspection Date" value={formatDate(currentRun.inspectedAt)} />
          <Detail label="Method" value="PAUT robotic tank floor scan" />
          <Detail label="Status" value={STATUS_LABELS[currentRun.status]} />
        </View>

        {/* Executive summary */}
        <Text style={styles.sectionTitle}>2. Executive Summary</Text>
        <Text style={styles.paragraph}>{executiveSummary}</Text>

        {/* Key metrics */}
        <Text style={styles.sectionTitle}>3. Thickness Summary</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{formatInches(metrics.minThickness)}</Text>
            <Text style={styles.metricLabel}>Min Thickness</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{formatInches(metrics.avgThickness)}</Text>
            <Text style={styles.metricLabel}>Avg Thickness</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{metrics.criticalCells}</Text>
            <Text style={styles.metricLabel}>Critical Readings</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{formatYears(metrics.estimatedRemainingLifeYears)}</Text>
            <Text style={styles.metricLabel}>Est. Remaining Life</Text>
          </View>
        </View>

        {/* Region breakdown */}
        <Text style={styles.sectionTitle}>4. Region Breakdown</Text>
        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, { width: "24%" }]}>Region</Text>
            <Text style={[styles.th, { width: "14%" }]}>Readings</Text>
            <Text style={[styles.th, { width: "14%" }]}>Min (in)</Text>
            <Text style={[styles.th, { width: "14%" }]}>Avg (in)</Text>
            <Text style={[styles.th, { width: "14%" }]}>Max Loss</Text>
            <Text style={[styles.th, { width: "20%" }]}>Severity</Text>
          </View>
          {regionSummaries.map((r, i) => (
            <View key={r.region} style={i === regionSummaries.length - 1 ? styles.trLast : styles.tr}>
              <Text style={[styles.td, { width: "24%" }]}>{REGION_LABELS[r.region]}</Text>
              <Text style={[styles.td, { width: "14%" }]}>{r.readingCount}</Text>
              <Text style={[styles.td, { width: "14%" }]}>{formatInches(r.minThickness, false)}</Text>
              <Text style={[styles.td, { width: "14%" }]}>{formatInches(r.avgThickness, false)}</Text>
              <Text style={[styles.td, { width: "14%" }]}>{formatPercent(r.maxMetalLossPercent, 0)}</Text>
              <View style={[styles.td, { width: "20%" }]}>
                <Text style={[styles.chip, { backgroundColor: sevHex(r.severity) }]}>
                  {SEVERITY_LABELS[r.severity]}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Simplified heatmap: per-region severity bars */}
        <Text style={styles.sectionTitle}>5. Floor Severity Map (by region)</Text>
        {regionSummaries.map((r) => (
          <View key={`bar-${r.region}`} style={{ marginBottom: 4 }}>
            <Text style={{ fontSize: 7.5, color: MUTED }}>{REGION_LABELS[r.region]}</Text>
            <View style={styles.barTrack}>
              <View
                style={{
                  width: `${Math.min(100, r.maxMetalLossPercent)}%`,
                  backgroundColor: sevHex(r.severity),
                }}
              />
            </View>
          </View>
        ))}

        {/* Findings */}
        <Text style={styles.sectionTitle}>6. Corrosion Findings</Text>
        {findings.length === 0 ? (
          <Text style={styles.paragraph}>No documented corrosion findings.</Text>
        ) : (
          findings.map((f) => (
            <View key={f.id} style={[styles.findingItem, { borderLeftColor: sevHex(f.severity) }]}>
              <Text style={styles.findingTitle}>
                {SEVERITY_LABELS[f.severity]} · {f.title}
              </Text>
              <Text style={styles.findingBody}>{f.description}</Text>
              <Text style={styles.findingBody}>Recommendation: {f.recommendation}</Text>
            </View>
          ))
        )}

        {/* Trend */}
        <Text style={styles.sectionTitle}>7. Trend Comparison</Text>
        {previous && current ? (
          <Text style={styles.paragraph}>
            Minimum thickness moved from {formatInches(previous.minThickness)} (
            {new Date(previousRun!.inspectedAt).getUTCFullYear()}) to{" "}
            {formatInches(current.minThickness)} ({new Date(currentRun.inspectedAt).getUTCFullYear()}
            ). Average thickness moved from {formatInches(previous.avgThickness)} to{" "}
            {formatInches(current.avgThickness)}. Critical readings changed from{" "}
            {previous.criticalCells} to {current.criticalCells}.
          </Text>
        ) : (
          <Text style={styles.paragraph}>
            No prior inspection available for trend comparison.
          </Text>
        )}

        {/* Recommendations */}
        <Text style={styles.sectionTitle}>8. Recommendations</Text>
        <Text style={styles.paragraph}>{metrics.recommendation}</Text>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text>
            Prototype uses mock processed PAUT-style data for demonstration only.
            This is not an API 653-certified engineering report. It does not
            perform raw ultrasonic signal processing, certified API 653
            calculations, or engineering review.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            TankSight · {tank.tankNumber} · {client.name}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
