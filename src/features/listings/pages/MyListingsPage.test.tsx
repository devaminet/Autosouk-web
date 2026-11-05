import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";

const statusCounts = {
  draft: 1,
  pending: 2,
  approved: 3,
  withdrawn: 0,
  rejected: 1,
  sold: 0,
};

const approved = {
  id: 1,
  title: "Volkswagen Golf 8 Life",
  description: "Clean car",
  status: "approved",
  approvedAt: "2026-11-01",
  rejectionReason: null,
  createdAt: "2026-10-01",
  updatedAt: "2026-10-03",
  completedInspectionsCount: 2,
  car: {
    id: 10,
    price: 265000,
    year: 2020,
    distance: "54000",
    carMedias: [
      { id: 100, type: "image", link: "https://cdn.test/golf.jpg", isPrimary: true },
    ],
  },
};

const rejected = {
  ...approved,
  id: 2,
  title: "Peugeot 208 Allure",
  status: "rejected",
  rejectionReason: "Add a photo of the dashboard.",
  completedInspectionsCount: 0,
};

const carlessDraft = {
  ...approved,
  id: 3,
  title: "My new car",
  status: "draft",
  completedInspectionsCount: 0,
  car: null,
};

const page = (
  listings: unknown[],
  meta: { totalPages?: number; page?: number } = {},
) => ({
  listings,
  meta: {
    total: listings.length,
    page: 1,
    limit: 10,
    totalPages: listings.length > 0 ? 1 : 0,
    statusCounts,
    ...meta,
  },
});

const renderPage = (entry = "/my-listings") => {
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({
        accessToken: "token",
        user: { ...testUser, role: "seller" },
      }),
    ),
  );
  return renderApp(entry);
};

const respondWith = (listings: unknown[], meta?: { totalPages?: number; page?: number }) => {
  server.use(
    http.get("*/api/listings/mine", () => HttpResponse.json(page(listings, meta))),
  );
};

describe("MyListingsPage", () => {
  it("shows each listing's details in the table", async () => {
    respondWith([approved]);
    renderPage();

    const table = await screen.findByRole("table");
    const row = within(table).getByRole("row", { name: /Volkswagen Golf 8 Life/u });

    expect(within(row).getByText("265 000")).toBeInTheDocument();
    expect(within(row).getByText("54 000")).toBeInTheDocument();
    expect(within(row).getByText("Approved")).toBeInTheDocument();
    expect(within(row).getByText("2 completed")).toBeInTheDocument();
    expect(within(row).getByRole("presentation")).toHaveAttribute(
      "src",
      "https://cdn.test/golf.jpg",
    );
  });

  it("counts listings by status in the stats and the filters", async () => {
    respondWith([approved]);
    renderPage();

    const filters = await screen.findByRole("navigation", { name: "Filter by status" });

    expect(within(filters).getByRole("link", { name: "All 7" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(filters).getByRole("link", { name: "Pending review 2" })).toBeInTheDocument();
    expect(screen.getByText("Approved & live").closest("div")?.parentElement).toHaveTextContent("3");
  });

  it("leaves out filters for statuses the API cannot set", async () => {
    respondWith([approved]);
    renderPage();

    const filters = await screen.findByRole("navigation", { name: "Filter by status" });

    expect(within(filters).queryByRole("link", { name: /Withdrawn/u })).not.toBeInTheDocument();
    expect(within(filters).queryByRole("link", { name: /Sold/u })).not.toBeInTheDocument();
  });

  it("filters by status through the URL and asks the API for it", async () => {
    const user = userEvent.setup();
    const requested: (string | null)[] = [];
    server.use(
      http.get("*/api/listings/mine", ({ request }) => {
        const status = new URL(request.url).searchParams.get("status");
        requested.push(status);
        return HttpResponse.json(page(status === "rejected" ? [rejected] : [approved]));
      }),
    );
    const router = renderPage();

    await user.click(await screen.findByRole("link", { name: "Rejected 1" }));

    expect(await within(screen.getByRole("table")).findByText("Peugeot 208 Allure")).toBeInTheDocument();
    expect(router.state.location.search).toBe("?status=rejected");
    expect(requested).toContain("rejected");
    expect(screen.getByRole("link", { name: "Rejected 1" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("ignores an invalid status in the URL", async () => {
    let requested: string | null = "unset";
    server.use(
      http.get("*/api/listings/mine", ({ request }) => {
        requested = new URL(request.url).searchParams.get("status");
        return HttpResponse.json(page([approved]));
      }),
    );
    renderPage("/my-listings?status=nope");

    await screen.findByRole("table");

    expect(requested).toBeNull();
  });

  it("shows why a listing was rejected", async () => {
    respondWith([rejected]);
    renderPage();

    const table = await screen.findByRole("table");

    expect(within(table).getByText("Why it was rejected:")).toBeInTheDocument();
    expect(within(table).getByText("Add a photo of the dashboard.")).toBeInTheDocument();
  });

  it("shows a draft that has no car yet", async () => {
    respondWith([carlessDraft]);
    renderPage();

    const table = await screen.findByRole("table");
    const row = within(table).getByRole("row", { name: /My new car/u });

    expect(within(row).getByText("Car details not added yet")).toBeInTheDocument();
    expect(within(row).getByText("Draft")).toBeInTheDocument();
  });

  it("explains an empty account and an empty filter differently", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/listings/mine", () => HttpResponse.json(page([]))),
    );
    renderPage();

    expect(await screen.findByText("You have no listings yet.")).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Draft 1" }));

    expect(await screen.findByText("You have no listings with this status.")).toBeInTheDocument();
  });

  it("moves between pages through the URL", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/listings/mine", ({ request }) => {
        const current = Number(new URL(request.url).searchParams.get("page"));
        return HttpResponse.json(
          page([current === 2 ? rejected : approved], { page: current, totalPages: 3 }),
        );
      }),
    );
    const router = renderPage();

    await user.click(await screen.findByRole("link", { name: "Next page" }));

    expect(await within(screen.getByRole("table")).findByText("Peugeot 208 Allure")).toBeInTheDocument();
    expect(router.state.location.search).toBe("?page=2");
    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
  });

  it("goes to the last page when the page in the URL no longer exists", async () => {
    server.use(
      http.get("*/api/listings/mine", ({ request }) => {
        const current = Number(new URL(request.url).searchParams.get("page"));
        return HttpResponse.json(page([approved], { page: current, totalPages: 2 }));
      }),
    );
    const router = renderPage("/my-listings?page=9");

    await screen.findByRole("link", { name: "Page 2" });

    expect(router.state.location.search).toBe("?page=2");
  });

  it("shows the API's error and can try again", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/listings/mine", () =>
        apiErrors(500, { code: "unexpected", message: "The server had a problem" }),
      ),
    );
    renderPage();

    // The query client retries once before it reports the error.
    const alert = await screen.findByRole("alert", {}, { timeout: 3000 });
    expect(alert).toHaveTextContent("The server had a problem");

    respondWith([approved]);
    await user.click(within(alert).getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("does not show one seller's listings to the next person who logs in", async () => {
    const user = userEvent.setup();
    respondWith([approved]);
    server.use(
      http.post("*/api/auth/logout", () =>
        HttpResponse.json({ code: "auth.logged_out", message: "Logged out" }),
      ),
    );
    const router = renderPage();

    await screen.findByRole("table");
    await user.click(screen.getByRole("button", { name: "Account" }));
    await user.click(screen.getByRole("button", { name: "Log out" }));
    await screen.findByLabelText("Email");

    respondWith([]);
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({ accessToken: "t", user: { ...testUser, id: 2, role: "seller" } }),
      ),
    );
    await user.type(screen.getByLabelText("Email"), "next@autosouk.ma");
    await user.type(screen.getByLabelText("Password"), "Str0ng!pass");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByText("You have no listings yet.")).toBeInTheDocument();
    expect(screen.queryByText("Volkswagen Golf 8 Life")).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/my-listings");
  });

  describe("deleting a listing", () => {
    const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
      const table = await screen.findByRole("table");
      await user.click(
        within(table).getByRole("button", { name: "Actions for Volkswagen Golf 8 Life" }),
      );
      await user.click(within(table).getByRole("button", { name: "Delete listing" }));
      return screen.findByRole("dialog", { name: "Delete this listing?" });
    };

    it("deletes the listing after the seller confirms", async () => {
      const user = userEvent.setup();
      let current = [approved, rejected];
      const deleted: string[] = [];
      server.use(
        http.get("*/api/listings/mine", () => HttpResponse.json(page(current))),
        http.delete("*/api/listings/:id", ({ params }) => {
          deleted.push(String(params.id));
          current = [rejected];
          return HttpResponse.json({ deleted: true, listingId: 1 });
        }),
      );
      renderPage();

      const dialog = await openDialog(user);
      expect(within(dialog).getByText("Volkswagen Golf 8 Life")).toBeInTheDocument();
      await user.click(within(dialog).getByRole("button", { name: "Delete listing" }));

      const notice = await screen.findByRole("status");
      expect(notice).toHaveTextContent("“Volkswagen Golf 8 Life” was deleted.");
      expect(notice).toHaveFocus();
      expect(deleted).toEqual(["1"]);
      expect(within(screen.getByRole("table")).queryByText("Volkswagen Golf 8 Life")).not.toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("keeps the listing when the seller cancels", async () => {
      const user = userEvent.setup();
      let deleteCalled = false;
      respondWith([approved]);
      server.use(
        http.delete("*/api/listings/:id", () => {
          deleteCalled = true;
          return HttpResponse.json({ deleted: true, listingId: 1 });
        }),
      );
      renderPage();

      const dialog = await openDialog(user);
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(deleteCalled).toBe(false);
      expect(within(screen.getByRole("table")).getByText("Volkswagen Golf 8 Life")).toBeInTheDocument();
    });

    it("shows the API's error in the dialog and allows another try", async () => {
      const user = userEvent.setup();
      respondWith([approved]);
      server.use(
        http.delete("*/api/listings/:id", () =>
          apiErrors(500, { code: "unexpected", message: "The server had a problem" }),
        ),
      );
      renderPage();

      const dialog = await openDialog(user);
      await user.click(within(dialog).getByRole("button", { name: "Delete listing" }));

      expect(await within(dialog).findByRole("alert")).toHaveTextContent("The server had a problem");
      expect(within(dialog).getByRole("button", { name: "Delete listing" })).toBeEnabled();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("forgets an earlier error when the dialog opens again", async () => {
      const user = userEvent.setup();
      respondWith([approved]);
      server.use(
        http.delete("*/api/listings/:id", () =>
          apiErrors(500, { code: "unexpected", message: "The server had a problem" }),
        ),
      );
      renderPage();

      const dialog = await openDialog(user);
      await user.click(within(dialog).getByRole("button", { name: "Delete listing" }));
      await within(dialog).findByRole("alert");
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

      const reopened = await openDialog(user);

      expect(within(reopened).queryByRole("alert")).not.toBeInTheDocument();
    });

    it("moves to the previous page when the last listing of the last page goes", async () => {
      const user = userEvent.setup();
      let isDeleted = false;
      server.use(
        http.get("*/api/listings/mine", ({ request }) => {
          const current = Number(new URL(request.url).searchParams.get("page"));
          return HttpResponse.json(
            isDeleted
              ? page(current === 1 ? [rejected] : [], { page: current, totalPages: 1 })
              : page([approved], { page: current, totalPages: 2 }),
          );
        }),
        http.delete("*/api/listings/:id", () => {
          isDeleted = true;
          return HttpResponse.json({ deleted: true, listingId: 1 });
        }),
      );
      const router = renderPage("/my-listings?page=2");

      const dialog = await openDialog(user);
      await user.click(within(dialog).getByRole("button", { name: "Delete listing" }));

      expect(await within(await screen.findByRole("table")).findByText("Peugeot 208 Allure")).toBeInTheDocument();
      expect(router.state.location.search).toBe("");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      const notice = screen.getByRole("status");
      expect(notice).toHaveTextContent("“Volkswagen Golf 8 Life” was deleted.");
      expect(notice).toHaveFocus();
    });
  });
});
