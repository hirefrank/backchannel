import { describe, test, expect } from "bun:test";
import { normalizeCompanyName, fuzzyMatch } from "./company-normalizer";

describe("normalizeCompanyName", () => {
  test("returns empty string for falsy input", () => {
    expect(normalizeCompanyName("")).toBe("");
    expect(normalizeCompanyName(null as any)).toBe("");
    expect(normalizeCompanyName(undefined as any)).toBe("");
  });

  test("normalizes known companies to canonical names", () => {
    expect(normalizeCompanyName("Google")).toBe("Google");
    expect(normalizeCompanyName("google")).toBe("Google");
    expect(normalizeCompanyName("google inc")).toBe("Google");
    expect(normalizeCompanyName("Google Inc.")).toBe("Google");
    expect(normalizeCompanyName("Alphabet")).toBe("Google");
    expect(normalizeCompanyName("alphabet inc")).toBe("Google");
  });

  test("normalizes Meta/Facebook variants", () => {
    expect(normalizeCompanyName("Meta")).toBe("Meta");
    expect(normalizeCompanyName("meta platforms")).toBe("Meta");
    expect(normalizeCompanyName("Facebook")).toBe("Meta");
    expect(normalizeCompanyName("facebook inc")).toBe("Meta");
  });

  test("normalizes Amazon variants", () => {
    expect(normalizeCompanyName("Amazon")).toBe("Amazon");
    expect(normalizeCompanyName("amazon.com")).toBe("Amazon");
    expect(normalizeCompanyName("Amazon Web Services")).toBe("Amazon");
    expect(normalizeCompanyName("amazon aws")).toBe("Amazon");
  });

  test("normalizes Microsoft variants", () => {
    expect(normalizeCompanyName("Microsoft")).toBe("Microsoft");
    expect(normalizeCompanyName("microsoft corporation")).toBe("Microsoft");
    expect(normalizeCompanyName("microsoft corp")).toBe("Microsoft");
  });

  test("normalizes Apple variants", () => {
    expect(normalizeCompanyName("Apple")).toBe("Apple");
    expect(normalizeCompanyName("apple inc")).toBe("Apple");
    expect(normalizeCompanyName("Apple Inc.")).toBe("Apple");
  });

  test("normalizes Shopify variants", () => {
    expect(normalizeCompanyName("Shopify")).toBe("Shopify");
    expect(normalizeCompanyName("shopify")).toBe("Shopify");
    expect(normalizeCompanyName("shopify inc")).toBe("Shopify");
  });

  test("strips common suffixes from unknown companies", () => {
    expect(normalizeCompanyName("Acme Inc")).toBe("Acme");
    expect(normalizeCompanyName("Acme Inc.")).toBe("Acme");
    expect(normalizeCompanyName("Acme LLC")).toBe("Acme");
    expect(normalizeCompanyName("Acme Corp")).toBe("Acme");
    expect(normalizeCompanyName("Acme Corporation")).toBe("Acme");
    expect(normalizeCompanyName("Acme Ltd")).toBe("Acme");
    expect(normalizeCompanyName("Acme Group")).toBe("Acme");
    expect(normalizeCompanyName("Acme Technologies")).toBe("Acme");
    expect(normalizeCompanyName("Acme Solutions")).toBe("Acme");
    expect(normalizeCompanyName("Acme Services")).toBe("Acme");
  });

  test("title cases unknown companies", () => {
    expect(normalizeCompanyName("acme")).toBe("Acme");
    expect(normalizeCompanyName("ACME")).toBe("Acme");
    expect(normalizeCompanyName("some company name")).toBe("Some Company Name");
  });

  test("handles whitespace correctly", () => {
    expect(normalizeCompanyName("  Google  ")).toBe("Google");
    expect(normalizeCompanyName("  acme  inc  ")).toBe("Acme");
  });
});

describe("fuzzyMatch", () => {
  test("returns true for exact matches after normalization", () => {
    expect(fuzzyMatch("Google", "google")).toBe(true);
    expect(fuzzyMatch("Google Inc", "google")).toBe(true);
    expect(fuzzyMatch("Meta", "Facebook")).toBe(true);
  });

  test("returns true when one contains the other", () => {
    expect(fuzzyMatch("Acme", "Acme Corporation")).toBe(true);
    expect(fuzzyMatch("Acme Corporation", "Acme")).toBe(true);
  });

  test("returns true for high similarity strings", () => {
    // These should be similar enough (>80%)
    expect(fuzzyMatch("Stripe", "Stripee")).toBe(true);
    expect(fuzzyMatch("Airbnb", "AirBnB")).toBe(true);
  });

  test("returns false for dissimilar companies", () => {
    expect(fuzzyMatch("Google", "Microsoft")).toBe(false);
    expect(fuzzyMatch("Apple", "Orange")).toBe(false);
    expect(fuzzyMatch("Stripe", "Square")).toBe(false);
  });

  test("handles edge cases", () => {
    expect(fuzzyMatch("", "")).toBe(true);
    expect(fuzzyMatch("A", "B")).toBe(false);
  });
});
