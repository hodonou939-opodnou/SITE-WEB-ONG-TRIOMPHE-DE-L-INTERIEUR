import { describe, expect, it } from "vitest";
import { deadlineDays, sortByUrgency } from "./funders-meta";

// 24 octobre 2026, 23 h 30 à Cotonou : encore le 24 sur place.
const NOW = new Date("2026-10-24T22:30:00Z");
const on = (day: string) => new Date(`${day}T12:00:00Z`);

describe("deadlineDays", () => {
  it("compte les jours calendaires du Bénin", () => {
    expect(deadlineDays(on("2026-10-24"), NOW)).toBe(0);
    expect(deadlineDays(on("2026-11-13"), NOW)).toBe(20);
  });
  it("ignore une échéance passée ou absente", () => {
    expect(deadlineDays(on("2026-10-23"), NOW)).toBeNull();
    expect(deadlineDays(null, NOW)).toBeNull();
  });
});

describe("sortByUrgency", () => {
  it("met les échéances à venir en tête, la plus proche d'abord, sans bouger le reste", () => {
    const items = [
      { name: "A", deadline: null },
      { name: "B", deadline: on("2026-11-17") },
      { name: "C", deadline: on("2026-05-22") },
      { name: "D", deadline: on("2026-11-13") },
      { name: "E", deadline: null },
    ];
    expect(sortByUrgency(items, NOW).map((i) => i.name)).toEqual(["D", "B", "A", "C", "E"]);
  });
});
