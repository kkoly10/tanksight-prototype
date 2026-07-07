/**
 * TankSight domain types.
 *
 * Units convention (kept consistent across the whole app):
 *   - Thickness / metal loss reference: INCHES  (API 653 aboveground storage tank
 *     floor plate is typically 0.250" nominal, so inches read authentically)
 *   - Spatial position on the tank floor (x, y, radius): FEET
 *   - Angle: DEGREES, 0deg = east (+x), 90deg = north (+y), measured counter-clockwise
 *   - metalLossPercent: 0-100
 *
 * These types intentionally mirror the shape of MongoDB documents. The in-memory
 * repository and the (later) MongoDB repository both return these exact types, so
 * swapping the data source never touches the domain, service, or UI layers.
 */

export type UserRole = "client" | "inspector";

export type Severity = "ok" | "monitor" | "concern" | "critical";

export type InspectionStatus = "healthy" | "monitor" | "action_recommended";

export type ReportStatus = "draft" | "ready";

export type ReportJobStatus = "queued" | "processing" | "ready" | "failed";

export type Region =
  | "center"
  | "north"
  | "south"
  | "east"
  | "west"
  | "annular";

export type Client = {
  id: string;
  name: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Present for client users; scopes every query to this client. */
  clientId?: string;
};

export type Site = {
  id: string;
  clientId: string;
  slug: string;
  name: string;
  location: string;
};

export type Tank = {
  id: string;
  clientId: string;
  siteId: string;
  slug: string;
  tankNumber: string;
  diameterFeet: number;
  product: string;
  /** Nominal (as-built) floor plate thickness in inches. */
  nominalThicknessInches: number;
};

export type InspectionRun = {
  id: string;
  clientId: string;
  siteId: string;
  tankId: string;
  /** ISO date string. */
  inspectedAt: string;
  method: "PAUT robotic tank floor scan";
  status: InspectionStatus;
  reportStatus: ReportStatus;
};

export type MeasurementCell = {
  id: string;
  clientId: string;
  siteId: string;
  tankId: string;
  inspectionRunId: string;
  /** Position on the tank floor, in feet (origin = tank center). */
  x: number;
  y: number;
  /** Distance from center, in feet. */
  radius: number;
  /** Degrees, 0 = east, 90 = north. */
  angle: number;
  region: Region;
  thicknessInches: number;
  nominalThicknessInches: number;
  metalLossPercent: number;
  severity: Severity;
};

export type Finding = {
  id: string;
  inspectionRunId: string;
  region: Region;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
};

export type RegionSummary = {
  region: Region;
  readingCount: number;
  minThickness: number;
  avgThickness: number;
  maxMetalLossPercent: number;
  severity: Severity;
  recommendation: string;
};

export type InspectionMetrics = {
  minThickness: number;
  avgThickness: number;
  nominalThickness: number;
  criticalCells: number;
  concernCells: number;
  monitorCells: number;
  okCells: number;
  totalCells: number;
  /** Null when there is no prior run or no measurable corrosion rate. */
  estimatedRemainingLifeYears: number | null;
  /** Corrosion rate in inches/year (null when not computable). */
  corrosionRateInchesPerYear: number | null;
  recommendation: string;
};

export type TrendPoint = {
  inspectedAt: string;
  minThickness: number;
  avgThickness: number;
  criticalCells: number;
};

/**
 * Everything the report preview page AND the PDF need. Both render from this one
 * shape, produced by a single report-data builder, so web and PDF never diverge.
 */
export type ReportData = {
  client: Client;
  site: Site;
  tank: Tank;
  currentRun: InspectionRun;
  previousRun: InspectionRun | null;
  metrics: InspectionMetrics;
  regionSummaries: RegionSummary[];
  findings: Finding[];
  trendData: TrendPoint[];
  executiveSummary: string;
  reportNumber: string;
  generatedAt: string;
};

/**
 * Report-generation job. In production this would be a Redis-backed queue; the
 * prototype persists these as documents to demonstrate the pipeline shape.
 */
export type ReportJob = {
  id: string;
  clientId: string;
  inspectionRunId: string;
  status: ReportJobStatus;
  requestedByUserId: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Documented-only audit concept. In production, every report generation,
 * approval, download and revision should write an immutable audit record.
 */
export type ReportDownloadLog = {
  id: string;
  clientId: string;
  inspectionRunId: string;
  downloadedByUserId: string;
  downloadedAt: string;
  fileName: string;
};
