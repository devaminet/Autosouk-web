import { describe, expect, it } from "vitest";
import { maskPhone } from "./recording";

describe("maskPhone", () => {
  it("keeps the country code and the last four digits", () => {
    expect(maskPhone("+212612345678")).toBe("+212 6 •• •• 56 78");
  });

  it("leaves a number too short to mask as it is", () => {
    expect(maskPhone("0612")).toBe("0612");
  });
});
