import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";
import type { InspectionStatus, QueuedInspection } from "../api";

const workshop = {
  id: 5,
  userId: testUser.id,
  name: "Garage Atlas Auto",
  cityId: 1,
  address: "Maârif",
  latitude: 33.58,
  longitude: -7.63,
  description: null,
  phone: "0661234567",
  inspectionPrice: 350,
  profileImageUrl: null,
  isActive: true,
  city: { id: 1, name: "Casablanca", slug: "casablanca" },
  garageImages: [],
};

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

const inspection = (id: number, status: InspectionStatus, title: string, changes: Partial<QueuedInspection> = {}): QueuedInspection => ({
  id,
  status,
  priceAtRequest: 350,
  requestedAt: hoursAgo(2),
  acceptedAt: status === "pending" ? null : hoursAgo(1),
  completedAt: status === "completed" ? hoursAgo(0.5) : null,
  verdict: status === "completed" ? "excellent" : null,
  overallScore: status === "completed" ? 92 : null,
  reportPdfLink: status === "completed" ? "http://storage.test/report.pdf" : null,
  car: {
    id: 100 + id,
    year: 2020,
    make: { name: "FIAT" },
    model: { name: "500" },
    listingId: 200 + id,
    title,
    photoUrl: null,
    seller: { firstName: "Karim", lastName: "Essaidi", phone: "0670112233" },
  },
  buyer: { id: 300 + id, firstName: "Omar", lastName: "Lahlou" },
  ...changes,
});

// A mechanic's queue kept in memory, so moves show up. Records the moves.
const queueApi = ({
  inspections = [
    inspection(1, "pending", "Fiat 500 Dolcevita"),
    inspection(2, "accepted", "Dacia Duster Prestige"),
    inspection(3, "in_progress", "Toyota Corolla Hybrid"),
    inspection(4, "completed", "Volkswagen Golf 8 Life"),
  ],
  hasWorkshop = true,
  moveError = null as { code: string; message: string } | null,
} = {}) => {
  const stored = [...inspections];
  const moves: { id: string; body: unknown }[] = [];
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "mechanic" } }),
    ),
    http.get("*/api/mechanics/me", () =>
      hasWorkshop
        ? HttpResponse.json({ mechanic: workshop })
        : apiErrors(404, { code: "mechanic.profile_not_found", message: "Workshop not found." }),
    ),
    http.get("*/api/mechanics/5", () =>
      HttpResponse.json({
        mechanic: { ...workshop, rating: { average: 4.9, count: 128, distribution: { 1: 0, 2: 0, 3: 2, 4: 10, 5: 116 } } },
      }),
    ),
    http.get("*/api/inspections", () => HttpResponse.json({ inspections: stored })),
    http.patch("*/api/inspections/:id", async ({ params, request }) => {
      const body = (await request.json()) as { status: InspectionStatus };
      moves.push({ id: String(params.id), body });
      if (moveError) {
        return apiErrors(400, moveError);
      }
      const index = stored.findIndex(({ id }) => String(id) === params.id);
      const current = stored[index];
      if (current) {
        stored[index] = { ...current, status: body.status };
      }
      return HttpResponse.json({ inspection: { id: Number(params.id), status: body.status } });
    }),
  );
  return { moves };
};

const column = async (name: string) => within(await screen.findByRole("region", { name: new RegExp(`^${name}`, "u") }));

describe("InspectionQueuePage", () => {
  it("sorts the requests into columns, with the figures above", async () => {
    queueApi();
    renderApp("/inspections");

    expect(await screen.findByRole("heading", { level: 1, name: "Inspection queue" })).toBeInTheDocument();
    expect(await screen.findByText("Garage Atlas Auto")).toBeInTheDocument();
    expect(screen.getByText("Accepting requests")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Workshop profile/u })).toHaveAttribute("href", "/workshop");

    const stats = await screen.findByLabelText("Your activity");
    expect(within(stats).getByText("Waiting for your answer").previousElementSibling).toHaveTextContent("1");
    expect(await within(stats).findByText("4.9")).toBeInTheDocument();
    expect(within(stats).getByText("128 reviews")).toBeInTheDocument();

    const pending = await column("New requests");
    expect(pending.getByRole("link", { name: "Fiat 500 Dolcevita" })).toHaveAttribute("href", "/listings/201");
    expect(pending.getByText(/Omar L\. · 2 hr\. ago/u)).toBeInTheDocument();
    expect(pending.queryByText(/Seller:/u)).not.toBeInTheDocument();

    const accepted = await column("Accepted");
    expect(accepted.getByRole("link", { name: "Call the seller, Karim E., on 0670112233" })).toHaveAttribute(
      "href",
      "tel:0670112233",
    );

    const completed = await column("Completed");
    expect(completed.getByText("Omar L. · score 92 · Excellent condition")).toBeInTheDocument();
    expect(completed.getByRole("link", { name: "Open the report for Volkswagen Golf 8 Life" })).toHaveAttribute(
      "href",
      "http://storage.test/report.pdf",
    );
  });

  it("accepts a new request, which moves to Accepted", async () => {
    const { moves } = queueApi();
    const user = userEvent.setup();
    renderApp("/inspections");

    await user.click((await column("New requests")).getByRole("button", { name: "Accept" }));

    expect(await (await column("Accepted")).findByRole("link", { name: "Fiat 500 Dolcevita" })).toBeInTheDocument();
    expect(moves).toEqual([{ id: "1", body: { status: "accepted" } }]);
    expect((await column("New requests")).getByText("No new requests.")).toBeInTheDocument();
  });

  it("asks before rejecting a request", async () => {
    const { moves } = queueApi();
    const user = userEvent.setup();
    renderApp("/inspections");

    await user.click((await column("New requests")).getByRole("button", { name: "Reject" }));
    const dialog = await screen.findByRole("dialog", { name: "Reject this request?" });
    expect(dialog).toHaveAccessibleDescription(
      "Omar L. will see that you declined the inspection of the Fiat 500 Dolcevita. You can't undo this.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Keep it" }));
    expect(moves).toEqual([]);

    await user.click((await column("New requests")).getByRole("button", { name: "Reject" }));
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Reject request" }));

    expect(await (await column("New requests")).findByText("No new requests.")).toBeInTheDocument();
    expect(moves).toEqual([{ id: "1", body: { status: "rejected" } }]);
  });

  it("starts an accepted inspection", async () => {
    const { moves } = queueApi();
    const user = userEvent.setup();
    renderApp("/inspections");

    await user.click((await column("Accepted")).getByRole("button", { name: "Start inspection" }));

    expect(await (await column("In progress")).findByRole("link", { name: "Dacia Duster Prestige" })).toBeInTheDocument();
    expect(moves).toEqual([{ id: "2", body: { status: "in_progress" } }]);
  });

  it("shows the API's message when a move fails", async () => {
    queueApi({
      moveError: { code: "inspection.invalid_transition", message: "This inspection has already moved past that step" },
    });
    const user = userEvent.setup();
    renderApp("/inspections");

    await user.click((await column("New requests")).getByRole("button", { name: "Accept" }));

    expect(await screen.findByText("This inspection has already moved past that step")).toBeInTheDocument();
  });

  it("picks the column to show on small screens from the address", async () => {
    queueApi();
    renderApp("/inspections?status=completed");

    const picker = await screen.findByRole("navigation", { name: "Requests by status" });
    expect(within(picker).getByRole("link", { name: "Completed 1" })).toHaveAttribute("aria-current", "page");
    expect(within(picker).getByRole("link", { name: "New requests 1" })).toHaveAttribute("href", "/inspections");
  });

  it("asks a mechanic without a workshop to set it up", async () => {
    queueApi({ hasWorkshop: false });
    renderApp("/inspections");

    expect(await screen.findByRole("link", { name: "Set up my workshop" })).toHaveAttribute("href", "/workshop");
  });

  it("is only for mechanics", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "buyer" } }),
      ),
    );
    renderApp("/inspections");

    expect(await screen.findByRole("heading", { name: "You can't open this page" })).toBeInTheDocument();
  });
});
