import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { emptyOverview, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";
import type { Review } from "../adminApi";
import type { DocumentType } from "../api";

const pendingDoc = (id: number, type: DocumentType) => ({
  id,
  type,
  status: "pending" as const,
  contentType: "image/jpeg",
  sizeBytes: 1000,
  validUntil: null,
  expired: false,
  rejectionReason: null,
  submittedAt: "2026-11-14T10:00:00.000Z",
  reviewedAt: null,
  createdAt: "2026-11-14T10:00:00.000Z",
});

const review: Review = {
  user: {
    id: 7,
    firstName: "Hamid",
    lastName: "Mansouri",
    email: "hamid@example.com",
    phone: "+212612345678",
    phoneVerified: true,
    identityStatus: "approved",
    createdAt: "2026-11-10T10:00:00.000Z",
  },
  mechanic: null,
  kind: "solo",
  status: "pending",
  bookable: false,
  approvedAt: null,
  validUntil: null,
  requiredTypes: ["cin_front", "cin_back"],
  expiringTypes: ["cin_front", "cin_back", "patente"],
  documents: [pendingDoc(11, "cin_front"), pendingDoc(12, "cin_back")],
};

// A signed-in admin and the review API. Records what the page sends.
const adminApi = () => {
  const sent = { links: [] as string[], decisions: [] as unknown[] };
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "admin" } }),
    ),
    http.get("*/api/mechanic-documents/reviews", () =>
      HttpResponse.json({
        reviews: [
          {
            user: { id: 7, firstName: "Hamid", lastName: "Mansouri", email: "hamid@example.com" },
            kind: "solo",
            mechanic: null,
            pendingCount: 2,
            submittedAt: "2026-11-14T10:00:00.000Z",
            resent: false,
          },
        ],
      }),
    ),
    http.get("*/api/mechanic-documents/reviews/7", () => HttpResponse.json(review)),
    http.get("*/api/mechanic-documents/documents/:id/link", ({ params }) => {
      sent.links.push(String(params.id));
      return HttpResponse.json({ url: `http://storage.test/doc-${String(params.id)}.jpg`, contentType: "image/jpeg", expiresAt: "" });
    }),
    http.post("*/api/mechanic-documents/reviews/7/decisions", async ({ request }) => {
      sent.decisions.push(await request.json());
      return HttpResponse.json({ ...review, status: "approved", bookable: true, documents: [] });
    }),
  );
  return sent;
};

describe("admin mechanic checks", () => {
  it("opens the first mechanic waiting and logs only the documents viewed", async () => {
    const sent = adminApi();
    renderApp("/admin/mechanics");

    const queue = within(await screen.findByRole("navigation", { name: /Waiting for review/ }));
    expect(queue.getByRole("link", { name: /Hamid Mansouri/ })).toHaveAttribute("aria-current", "page");
    expect(await screen.findByRole("heading", { name: "Hamid Mansouri", level: 2 })).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: "CIN · front" })).toHaveAttribute("src", "http://storage.test/doc-11.jpg");
    expect(sent.links).toEqual(["11"]);
  });

  it("approves every document with its end date, after the checks", async () => {
    const user = userEvent.setup();
    const sent = adminApi();
    renderApp("/admin/mechanics?mechanic=7");

    await screen.findByRole("heading", { name: "Hamid Mansouri", level: 2 });
    const approve = screen.getByRole("button", { name: "Approve mechanic" });
    expect(approve).toBeDisabled();

    for (const name of ["CIN · front", "CIN · back"]) {
      const decision = within(screen.getByRole("group", { name: `Decision on ${name}` }));
      await user.click(decision.getByRole("radio", { name: "Approve" }));
      await user.type(decision.getByLabelText("Valid until"), "2031-03-14");
    }
    expect(approve).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: "The CIN matches the account's name and face check" }));
    await user.click(screen.getByRole("checkbox", { name: "Every document is valid today" }));
    await user.click(approve);

    expect(await screen.findByText("Decision saved. We emailed Hamid.")).toBeInTheDocument();
    expect(sent.decisions).toEqual([
      {
        decisions: [
          { documentId: 11, decision: "approved", validUntil: "2031-03-14" },
          { documentId: 12, decision: "approved", validUntil: "2031-03-14" },
        ],
      },
    ]);
  });

  it("asks again for a rejected document, with a reason the mechanic reads", async () => {
    const user = userEvent.setup();
    const sent = adminApi();
    renderApp("/admin/mechanics?mechanic=7");

    await screen.findByRole("heading", { name: "Hamid Mansouri", level: 2 });
    const front = within(screen.getByRole("group", { name: "Decision on CIN · front" }));
    await user.click(front.getByRole("radio", { name: "Approve" }));
    await user.type(front.getByLabelText("Valid until"), "2031-03-14");
    const back = within(screen.getByRole("group", { name: "Decision on CIN · back" }));
    await user.click(back.getByRole("radio", { name: "Reject" }));
    await user.click(back.getByRole("button", { name: "Unreadable" }));
    expect(back.getByLabelText("Reason for rejecting CIN · back")).toHaveValue(
      "We can't read this document. Upload a sharp photo or scan, without glare.",
    );
    await user.click(screen.getByRole("checkbox", { name: "The CIN matches the account's name and face check" }));
    await user.click(screen.getByRole("checkbox", { name: "Every document is valid today" }));
    await user.click(screen.getByRole("button", { name: "Ask for 1 document again" }));

    expect(await screen.findByText("Decision saved. We emailed Hamid.")).toBeInTheDocument();
    expect(sent.decisions).toEqual([
      {
        decisions: [
          { documentId: 11, decision: "approved", validUntil: "2031-03-14" },
          {
            documentId: 12,
            decision: "rejected",
            reason: "We can't read this document. Upload a sharp photo or scan, without glare.",
          },
        ],
      },
    ]);
  });

  it("shows in the menu how many mechanics wait", async () => {
    adminApi();
    server.use(
      http.get("*/api/admin/overview", () =>
        HttpResponse.json({ ...emptyOverview, queues: { ...emptyOverview.queues, mechanicDocuments: 3 } }),
      ),
    );
    renderApp("/admin/mechanics");

    const menu = within(await screen.findByRole("navigation", { name: "Admin" }));
    expect(await menu.findByRole("link", { name: "Mechanic checks 3 waiting" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps the page for admins", async () => {
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "mechanic" } }),
      ),
    );
    renderApp("/admin/mechanics");

    expect(await screen.findByRole("heading", { name: "You can't open this page" })).toBeInTheDocument();
  });
});
