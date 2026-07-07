import { describe, expect, it } from "vitest";
import {
  aggregateSeverity,
  classifySeverity,
  worstSeverity,
} from "@/lib/domain/severity";

describe("classifySeverity", () => {
  it("returns ok for healthy thickness and low metal loss", () => {
    expect(classifySeverity(0.245, 2)).toBe("ok");
  });

  it("classifies by absolute thickness bands", () => {
    expect(classifySeverity(0.225, 0)).toBe("monitor"); // <= 0.230
    expect(classifySeverity(0.205, 0)).toBe("concern"); // <= 0.210
    expect(classifySeverity(0.185, 0)).toBe("critical"); // <= 0.190
  });

  it("escalates on metal loss even when thickness looks fine", () => {
    expect(classifySeverity(0.245, 8)).toBe("monitor");
    expect(classifySeverity(0.245, 16)).toBe("concern");
    expect(classifySeverity(0.245, 24)).toBe("critical");
  });

  it("takes the worst of the two signals", () => {
    // Thickness says monitor (0.225), metal loss says critical (25%).
    expect(classifySeverity(0.225, 25)).toBe("critical");
  });

  it("treats thresholds as inclusive boundaries", () => {
    expect(classifySeverity(0.19, 0)).toBe("critical");
    expect(classifySeverity(0.23, 0)).toBe("monitor");
  });
});

describe("worstSeverity / aggregateSeverity", () => {
  it("picks the more severe of two", () => {
    expect(worstSeverity("ok", "critical")).toBe("critical");
    expect(worstSeverity("monitor", "concern")).toBe("concern");
  });

  it("reduces a list to its worst member", () => {
    expect(aggregateSeverity(["ok", "monitor", "concern"])).toBe("concern");
    expect(aggregateSeverity([])).toBe("ok");
  });
});
