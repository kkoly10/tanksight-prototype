import { describe, expect, it } from "vitest";
import { assignRegion } from "@/lib/domain/region";

const R = 60; // 120 ft tank -> 60 ft radius

describe("assignRegion", () => {
  it("assigns the outer ring to annular", () => {
    expect(assignRegion(58, R, 45)).toBe("annular"); // 58/60 = 0.97 >= 0.88
  });

  it("assigns the inner disc to center", () => {
    expect(assignRegion(5, R, 200)).toBe("center"); // 5/60 = 0.08 <= 0.15
  });

  it("assigns quadrants by angle for the mid band", () => {
    const mid = 30; // 0.5 of radius -> not annular, not center
    expect(assignRegion(mid, R, 90)).toBe("north"); // +y
    expect(assignRegion(mid, R, 180)).toBe("west"); // -x
    expect(assignRegion(mid, R, 270)).toBe("south"); // -y
    expect(assignRegion(mid, R, 0)).toBe("east"); // +x
  });

  it("wraps angles outside [0,360)", () => {
    expect(assignRegion(30, R, -90)).toBe("south"); // -90 == 270
  });
});
