import type { Region } from "@/lib/types";

/**
 * Tank-floor region assignment from polar coordinates.
 *
 * Layout (looking down at the floor, north = +y):
 *   - annular: outer ring near the shell (radius >= 88% of tank radius). This is
 *     where floor-to-shell corrosion concentrates, so it gets its own band.
 *   - center: inner disc (radius <= 15% of tank radius).
 *   - otherwise a compass quadrant by angle (0deg = east, 90deg = north).
 */

export const ANNULAR_RADIUS_FRACTION = 0.88;
export const CENTER_RADIUS_FRACTION = 0.15;

export const REGION_LABELS: Record<Region, string> = {
  center: "Center Floor",
  north: "North Quadrant",
  south: "South Quadrant",
  east: "East Quadrant",
  west: "West Quadrant",
  annular: "Annular Ring",
};

function quadrantFromAngle(angleDeg: number): Region {
  // Normalize to [0, 360).
  const a = ((angleDeg % 360) + 360) % 360;
  if (a >= 45 && a < 135) return "north";
  if (a >= 135 && a < 225) return "west";
  if (a >= 225 && a < 315) return "south";
  return "east";
}

export function assignRegion(radiusFeet: number, tankRadiusFeet: number, angleDeg: number): Region {
  const fraction = radiusFeet / tankRadiusFeet;
  if (fraction >= ANNULAR_RADIUS_FRACTION) return "annular";
  if (fraction <= CENTER_RADIUS_FRACTION) return "center";
  return quadrantFromAngle(angleDeg);
}
