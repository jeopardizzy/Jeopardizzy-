import { describe, expect, it } from "vitest";
import { nextAnswering } from "../../src/lib/turns";

describe("nextAnswering (steals)", () => {
  const teams = [0, 1, 2, 3];

  it("starts with the team that picked the tile", () => {
    expect(nextAnswering(teams, 2, [])).toBe(2);
  });

  it("passes to the next team in seating order after a miss, wrapping around", () => {
    expect(nextAnswering(teams, 2, [2])).toBe(3);
    expect(nextAnswering(teams, 2, [2, 3])).toBe(0);
    expect(nextAnswering(teams, 3, [3])).toBe(0);
  });

  it("skips teams that already missed, even if chosen out of order", () => {
    expect(nextAnswering(teams, 0, [0, 1, 3])).toBe(2);
  });

  it("is null once every team has missed", () => {
    expect(nextAnswering(teams, 1, [0, 1, 2, 3])).toBeNull();
    expect(nextAnswering([0], 0, [0])).toBeNull();
  });
});
