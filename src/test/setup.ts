import { server } from "./bootstrap";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeEach } from "vitest";
import { setAccessToken } from "../lib/api/client";
import i18n from "../lib/i18n";
import { queryClient } from "../lib/queryClient";

beforeEach(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  queryClient.clear();
  setAccessToken(null);
});

afterAll(() => {
  server.close();
});
