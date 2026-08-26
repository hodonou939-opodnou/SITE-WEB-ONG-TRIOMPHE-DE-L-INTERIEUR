import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("prefixes a local Bénin number with +229", () => {
    expect(normalizePhone("0196966501")).toBe("+2290196966501");
  });

  it("leaves an already-international number untouched", () => {
    expect(normalizePhone("+2290196966501")).toBe("+2290196966501");
  });

  it("converts a 00-prefixed international number to +", () => {
    expect(normalizePhone("00229 01 68 28 06 75")).toBe("+2290168280675");
  });

  it("strips spaces, dots, dashes and parentheses before prefixing", () => {
    expect(normalizePhone("01 68-28.06(75)")).toBe("+2290168280675");
  });
});
