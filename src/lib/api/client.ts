import { z } from "zod";
import i18n, { getLocale } from "../i18n";

export type ApiIssue = {
  code: string;
  message: string;
  field?: string;
  params?: Record<string, unknown>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly issues: ApiIssue[];

  constructor(status: number, issues: ApiIssue[]) {
    super(issues[0]?.message ?? "API error");
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }

  get code(): string | undefined {
    return this.issues[0]?.code;
  }
}

const errorBodySchema = z.object({
  errors: z.array(
    z.object({
      code: z.string(),
      message: z.string(),
      field: z.string().optional(),
      params: z.record(z.string(), z.unknown()).optional(),
    }),
  ),
});

const localError = (status: number, code: string, key: string) =>
  new ApiError(status, [{ code, message: i18n.t(key) }]);

// The access token stays in memory only, so scripts cannot read it from storage.
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

type UnauthorizedHandler = () => Promise<boolean>;

let onUnauthorized: UnauthorizedHandler | null = null;

// Auth code registers this, so the client does not depend on a feature.
export const setUnauthorizedHandler = (handler: UnauthorizedHandler) => {
  onUnauthorized = handler;
};

type RequestOptions<T> = {
  schema: z.ZodType<T>;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  // Skips the bearer token, and the refresh and retry after a 401.
  anonymous?: boolean;
};

const send = async <T>(
  path: string,
  { method = "GET", body, anonymous = false }: RequestOptions<T>,
) => {
  const headers = new Headers({ "Accept-Language": getLocale() });
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken && !anonymous) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  try {
    return await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw localError(0, "network", "common:errors.network");
  }
};

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

export const request = async <T>(
  path: string,
  options: RequestOptions<T>,
): Promise<T> => {
  let response = await send(path, options);

  if (response.status === 401 && !options.anonymous && onUnauthorized) {
    if (await onUnauthorized()) {
      response = await send(path, options);
    }
  }

  const body = await readJson(response);

  if (!response.ok) {
    const parsedError = errorBodySchema.safeParse(body);
    if (parsedError.success && parsedError.data.errors.length > 0) {
      throw new ApiError(response.status, parsedError.data.errors);
    }
    throw localError(response.status, "unexpected", "common:errors.unexpected");
  }

  const parsed = options.schema.safeParse(body);
  if (!parsed.success) {
    throw localError(
      response.status,
      "invalid_response",
      "common:errors.unexpected",
    );
  }
  return parsed.data;
};
