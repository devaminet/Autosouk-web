import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";
import type { AuditEntry } from "../api";

const actor = { id: 1, firstName: "Salma", lastName: "Admin" };

const entry = (id: number, changes: Partial<AuditEntry>): AuditEntry => ({
  id,
  action: "user.suspended",
  targetType: "user",
  targetId: 12,
  details: null,
  createdAt: "2026-11-10T09:42:00.000Z",
  actor,
  ...changes,
});

const adminApi = () => {
  const queries: string[] = [];
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "admin" } }),
    ),
    http.get("*/api/admin/audit-log", ({ request }) => {
      queries.push(new URL(request.url).search);
      return HttpResponse.json({
        entries: [
          entry(30, { details: { reason: "Fake listings" } }),
          entry(29, {
            action: "user.deleted",
            targetId: 40,
            details: { reason: "Asked by the user", name: "Omar Fassi", email: "omar@example.com", role: "buyer" },
          }),
          entry(27, {
            action: "listing.rejected",
            targetType: "listing",
            targetId: 4820,
            details: { reason: "Blurry photos", title: "Peugeot 208 GT", sellerId: 12 },
          }),
          entry(28, {
            action: "mechanic_document.approved",
            targetType: "mechanic_document",
            targetId: 7,
            details: { validUntil: "2031-03-14" },
          }),
        ],
        actions: ["mechanic_document.approved", "user.deleted", "user.suspended"],
        meta: { total: 3, page: 1, limit: 20, totalPages: 1 },
      });
    }),
  );
  return { queries };
};

describe("admin audit log", () => {
  it("lists who did what, with the reason and what a deletion kept", async () => {
    adminApi();
    renderApp("/admin/audit-log");

    const table = within(await screen.findByRole("table", { name: "Audit log" }));
    const [, suspended, deleted, rejected, document] = table.getAllByRole("row");
    expect(suspended).toHaveTextContent("Suspended account");
    expect(suspended).toHaveTextContent("Reason: Fake listings");
    expect(within(suspended!).getByRole("link", { name: "User #12" })).toHaveAttribute("href", "/admin/users/12");

    expect(deleted).toHaveTextContent("Omar Fassi · omar@example.com");
    expect(within(deleted!).queryByRole("link", { name: "User #40" })).not.toBeInTheDocument();
    expect(document).toHaveTextContent("Valid until Mar 14, 2031");
    expect(rejected).toHaveTextContent("Rejected listing");
    expect(rejected).toHaveTextContent("Peugeot 208 GT");
    expect(within(rejected!).getByRole("link", { name: "Listing #4820" })).toHaveAttribute("href", "/listings/4820");

    const menu = within(screen.getByRole("navigation", { name: "Admin" }));
    expect(menu.getByRole("link", { name: "Audit log" })).toHaveAttribute("aria-current", "page");
  });

  it("filters by action, admin and target", async () => {
    const user = userEvent.setup();
    const { queries } = adminApi();
    renderApp("/admin/audit-log");

    await screen.findByRole("table", { name: "Audit log" });
    await user.selectOptions(screen.getByLabelText("Action"), "Deleted account");
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&action=user.deleted"));

    await user.click(screen.getAllByRole("link", { name: "Entries by Salma Admin" })[0]!);
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&action=user.deleted&actorId=1"));
    expect(await screen.findByText("Entries by Salma Admin", { selector: "span" })).toBeInTheDocument();

    await user.click(screen.getAllByRole("link", { name: "Everything about User #12" })[0]!);
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&action=user.deleted&targetType=user&targetId=12&actorId=1"));
    expect(screen.getByText("Entries about User #12")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Show every admin" }));
    await waitFor(() => expect(queries.at(-1)).toBe("?page=1&action=user.deleted&targetType=user&targetId=12"));
  });
});
