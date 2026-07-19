import { describe, it, expect } from "vitest";
import { formatDateOnly } from "./date";

describe("formatDateOnly", () => {
  it("shows the entered calendar date regardless of timezone (UTC-midnight input)", () => {
    // A date-only value stored as UTC midnight must not roll back a day when
    // formatted in a negative-offset timezone.
    expect(formatDateOnly("2022-02-17T00:00:00.000Z", "MMMM d, yyyy")).toBe("February 17, 2022");
  });

  it("accepts Date objects and a custom format", () => {
    expect(formatDateOnly(new Date("2024-03-09T00:00:00.000Z"), "MMM yyyy")).toBe("Mar 2024");
  });

  it("returns empty string for null/undefined/invalid", () => {
    expect(formatDateOnly(null)).toBe("");
    expect(formatDateOnly(undefined)).toBe("");
    expect(formatDateOnly("not-a-date")).toBe("");
  });
});
