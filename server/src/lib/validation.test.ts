import { describe, test, expect } from "bun:test";
import { isValidLinkedInUrl, normalizeLinkedInUrl } from "./validation";

describe("isValidLinkedInUrl", () => {
  test("accepts valid LinkedIn profile URLs", () => {
    expect(isValidLinkedInUrl("https://linkedin.com/in/johndoe")).toBe(true);
    expect(isValidLinkedInUrl("https://www.linkedin.com/in/johndoe")).toBe(true);
    expect(isValidLinkedInUrl("http://linkedin.com/in/johndoe")).toBe(true);
    expect(isValidLinkedInUrl("http://www.linkedin.com/in/johndoe")).toBe(true);
    expect(isValidLinkedInUrl("https://linkedin.com/in/johndoe/")).toBe(true);
  });

  test("accepts usernames with hyphens and numbers", () => {
    expect(isValidLinkedInUrl("https://linkedin.com/in/john-doe")).toBe(true);
    expect(isValidLinkedInUrl("https://linkedin.com/in/john-doe-123")).toBe(true);
    expect(isValidLinkedInUrl("https://linkedin.com/in/johndoe123")).toBe(true);
    expect(isValidLinkedInUrl("https://linkedin.com/in/john_doe")).toBe(true);
  });

  test("rejects invalid URLs", () => {
    expect(isValidLinkedInUrl("")).toBe(false);
    expect(isValidLinkedInUrl("not a url")).toBe(false);
    expect(isValidLinkedInUrl("https://google.com")).toBe(false);
    expect(isValidLinkedInUrl("https://linkedin.com")).toBe(false);
    expect(isValidLinkedInUrl("https://linkedin.com/company/acme")).toBe(false);
    expect(isValidLinkedInUrl("https://linkedin.com/jobs")).toBe(false);
    expect(isValidLinkedInUrl("https://linkedin.com/in/")).toBe(false);
  });

  test("rejects malformed inputs", () => {
    expect(isValidLinkedInUrl(null as any)).toBe(false);
    expect(isValidLinkedInUrl(undefined as any)).toBe(false);
    expect(isValidLinkedInUrl(123 as any)).toBe(false);
  });

  test("handles whitespace", () => {
    expect(isValidLinkedInUrl("  https://linkedin.com/in/johndoe  ")).toBe(true);
  });
});

describe("normalizeLinkedInUrl", () => {
  test("adds https:// if missing protocol", () => {
    expect(normalizeLinkedInUrl("linkedin.com/in/johndoe")).toBe("https://linkedin.com/in/johndoe");
    expect(normalizeLinkedInUrl("www.linkedin.com/in/johndoe")).toBe("https://www.linkedin.com/in/johndoe");
  });

  test("preserves existing protocol", () => {
    expect(normalizeLinkedInUrl("https://linkedin.com/in/johndoe")).toBe("https://linkedin.com/in/johndoe");
    expect(normalizeLinkedInUrl("http://linkedin.com/in/johndoe")).toBe("http://linkedin.com/in/johndoe");
  });

  test("removes trailing slash", () => {
    expect(normalizeLinkedInUrl("https://linkedin.com/in/johndoe/")).toBe("https://linkedin.com/in/johndoe");
  });

  test("trims whitespace", () => {
    expect(normalizeLinkedInUrl("  https://linkedin.com/in/johndoe  ")).toBe("https://linkedin.com/in/johndoe");
  });
});
