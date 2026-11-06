import { server } from "./bootstrap";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeEach } from "vitest";
import { setAccessToken } from "../lib/api/client";
import i18n from "../lib/i18n";
import { queryClient } from "../lib/queryClient";

// jsdom has the dialog element but not these methods.
HTMLDialogElement.prototype.showModal = function showModal() {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close() {
  this.open = false;
  this.dispatchEvent(new Event("close"));
};

// jsdom has no object URLs. Previews only need a unique string.
let objectUrls = 0;
URL.createObjectURL = () => {
  objectUrls += 1;
  return `blob:test/${objectUrls}`;
};
URL.revokeObjectURL = () => undefined;

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
