import { describe, expect, it } from "vitest";
import { passwordRules } from "./passwordRules";

const met = (password: string) =>
  passwordRules(password)
    .filter((rule) => rule.met)
    .map((rule) => rule.id);

describe("passwordRules", () => {
  it("meets nothing for an empty password", () => {
    expect(met("")).toEqual([]);
  });

  it("needs both cases", () => {
    expect(met("abc")).toEqual([]);
    expect(met("aBc")).toEqual(["case"]);
  });

  it("meets every rule for a strong password", () => {
    expect(met("Str0ng!pass")).toEqual(["length", "case", "number", "symbol"]);
  });

  it("accepts the symbols in the API's range from * to /", () => {
    expect(met("+")).toContain("symbol");
    expect(met("_")).not.toContain("symbol");
  });
});
