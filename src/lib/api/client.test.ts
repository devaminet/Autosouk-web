import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { server } from "../../test/bootstrap";
import { apiErrors } from "../../test/handlers";
import i18n from "../i18n";
import { ApiError, request, setAccessToken, setUnauthorizedHandler } from "./client";

const schema = z.object({ ok: z.boolean() });

describe("request", () => {
  it("sends the current language", async () => {
    await i18n.changeLanguage("ar");
    let language: string | null = null;
    server.use(
      http.get("*/api/thing", ({ request: req }) => {
        language = req.headers.get("Accept-Language");
        return HttpResponse.json({ ok: true });
      }),
    );

    await request("/api/thing", { schema });

    expect(language).toBe("ar");
  });

  it("throws the API's errors with their code and field", async () => {
    server.use(
      http.get("*/api/thing", () =>
        apiErrors(400, { code: "auth.email_in_use", message: "Email in use", field: "email" }),
      ),
    );

    const error = await request("/api/thing", { schema }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: "auth.email_in_use",
      issues: [{ field: "email", message: "Email in use" }],
    });
  });

  it("rejects a response that does not match the schema", async () => {
    server.use(http.get("*/api/thing", () => HttpResponse.json({ ok: "yes" })));

    await expect(request("/api/thing", { schema })).rejects.toMatchObject({
      code: "invalid_response",
    });
  });

  it("reports a network failure as a translated error", async () => {
    server.use(http.get("*/api/thing", () => HttpResponse.error()));

    await expect(request("/api/thing", { schema })).rejects.toMatchObject({
      code: "network",
      message: i18n.t("common:errors.network"),
    });
  });

  it("refreshes once after a 401, then retries with the new token", async () => {
    setAccessToken("old");
    const seen: (string | null)[] = [];
    server.use(
      http.get("*/api/thing", ({ request: req }) => {
        const authorization = req.headers.get("Authorization");
        seen.push(authorization);
        return authorization === "Bearer new"
          ? HttpResponse.json({ ok: true })
          : apiErrors(401, { code: "not_authorized", message: "Not authorized" });
      }),
    );
    const refresh = vi.fn(async () => {
      setAccessToken("new");
      return true;
    });
    setUnauthorizedHandler(refresh);

    await expect(request("/api/thing", { schema })).resolves.toEqual({ ok: true });

    expect(refresh).toHaveBeenCalledOnce();
    expect(seen).toEqual(["Bearer old", "Bearer new"]);
  });

  it("does not refresh for an anonymous request", async () => {
    server.use(
      http.post("*/api/thing", () =>
        apiErrors(401, { code: "auth.invalid_credentials", message: "Wrong" }),
      ),
    );
    const refresh = vi.fn(async () => true);
    setUnauthorizedHandler(refresh);

    await expect(
      request("/api/thing", { method: "POST", schema, anonymous: true }),
    ).rejects.toMatchObject({ status: 401 });

    expect(refresh).not.toHaveBeenCalled();
  });
});
