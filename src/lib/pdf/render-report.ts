import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";
import type { ReportData } from "@/lib/types";
import { InspectionReportDocument } from "@/lib/pdf/InspectionReportDocument";

/**
 * Render a ReportData object to a PDF buffer. Kept separate from the API route so
 * the rendering can be reused (e.g. a background report-generation worker) and
 * unit-tested independently of HTTP.
 */
export async function renderReportPdf(data: ReportData): Promise<Buffer> {
  // The component returns a <Document>; cast the element so react-pdf's typed
  // renderToBuffer (which expects a DocumentProps element) accepts it.
  const element = createElement(InspectionReportDocument, {
    data,
  }) as unknown as ReactElement<DocumentProps>;
  return renderToBuffer(element);
}

export function reportFileName(tankNumber: string): string {
  return `${tankNumber}-inspection-report.pdf`;
}
