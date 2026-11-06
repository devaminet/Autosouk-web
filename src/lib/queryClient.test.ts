import { describe, expect, it } from "vitest";
import { ApiError } from "./api/client";
import { shouldRetry } from "./queryClient";

const apiError = (status: number) => new ApiError(status, [{ code: "test", message: "Test" }]);

describe("shouldRetry", () => {
  it("never retries a 404", () => {
    expect(shouldRetry(0, apiError(404))).toBe(false);
  });

  it("retries other failures once", () => {
    expect(shouldRetry(0, apiError(500))).toBe(true);
    expect(shouldRetry(0, new Error("offline"))).toBe(true);
    expect(shouldRetry(1, apiError(500))).toBe(false);
  });
});
