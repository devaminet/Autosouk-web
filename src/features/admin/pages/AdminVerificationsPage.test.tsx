import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";
import type { Verification } from "../verificationsApi";

const buyerReview: Verification = {
  user: {
    id: 21,
    firstName: "Nadia",
    lastName: "El Fassi",
    email: "nadia@example.com",
    phone: "+212670112233",
    role: "buyer",
    emailVerified: true,
    phoneVerifiedAt: "2026-11-16T10:00:00.000Z",
    identityStatus: "pending",
    locale: "fr",
    city: { name: "Casablanca", slug: "casablanca" },
    suspendedAt: null,
    createdAt: "2026-11-16",
  },
  faceCheck: {
    id: 5,
    challenges: ["turn_left", "smile", "look_up"],
    submittedAt: "2026-11-17T09:12:00.000Z",
    contentType: "video/webm",
    videoUrl: "http://storage.test/face.webm",
  },
  faceCheckHistory: [
    {
      id: 4,
      status: "rejected",
      submittedAt: "2026-11-16T10:00:00.000Z",
      reviewedAt: "2026-11-16T12:00:00.000Z",
      rejectionReason: "Too dark",
    },
  ],
  attempts: { rejected: 1, max: 3 },
  mechanic: null,
  documents: null,
};

const decided: Verification = {
  ...buyerReview,
  user: { ...buyerReview.user, identityStatus: "approved" },
  faceCheck: null,
  faceCheckHistory: [
    { id: 5, status: "approved", submittedAt: null, reviewedAt: "2026-11-17T10:00:00.000Z", rejectionReason: null },
    ...buyerReview.faceCheckHistory,
  ],
};

const adminApi = (review: Verification = buyerReview) => {
  const decisions: unknown[] = [];
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "admin" } }),
    ),
    http.get("*/api/admin/verifications", () =>
      HttpResponse.json({
        verifications: [
          {
            user: { id: 7, firstName: "Hamid", lastName: "Mansouri", email: "hamid@example.com", role: "mechanic" },
            mechanic: { name: "Garage Atlas Auto", kind: "garage" },
            waiting: { faceCheck: true, documents: 6 },
            since: "2026-11-15T09:00:00.000Z",
            resent: false,
          },
          {
            user: { id: 21, firstName: "Nadia", lastName: "El Fassi", email: "nadia@example.com", role: "buyer" },
            mechanic: null,
            waiting: { faceCheck: true, documents: 0 },
            since: "2026-11-17T09:12:00.000Z",
            resent: true,
          },
        ],
      }),
    ),
    http.get(`*/api/admin/verifications/${review.user.id}`, () => HttpResponse.json(review)),
    http.post(`*/api/admin/verifications/${review.user.id}/decision`, async ({ request }) => {
      decisions.push(await request.json());
      return HttpResponse.json(decided);
    }),
  );
  return decisions;
};

describe("admin verifications", () => {
  it("lists everyone waiting, with what waits", async () => {
    adminApi();
    renderApp("/admin/verifications");

    const table = within(await screen.findByRole("table", { name: "People waiting for a check" }));
    const [, hamid, nadia] = table.getAllByRole("row");
    expect(hamid).toHaveTextContent("Garage Atlas Auto · Garage");
    expect(hamid).toHaveTextContent("Face video");
    expect(hamid).toHaveTextContent("6 documents");
    expect(nadia).toHaveTextContent("Sent again after a rejection");
    expect(within(nadia!).getByRole("link", { name: "Review Nadia El Fassi" })).toHaveAttribute(
      "href",
      "/admin/verifications/21",
    );
  });

  it("approves a face video once every check is ticked", async () => {
    const user = userEvent.setup();
    const decisions = adminApi();
    renderApp("/admin/verifications/21");

    expect(await screen.findByRole("heading", { name: "Nadia El Fassi", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Face video of Nadia El Fassi")).toHaveAttribute("src", "http://storage.test/face.webm");
    const challenges = within(screen.getByRole("list", { name: "Challenges asked, in order" }));
    expect(challenges.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "1Turn your head left",
      "2Smile",
      "3Look up",
    ]);
    expect(screen.getByText("1 rejected of 3 allowed")).toBeInTheDocument();
    expect(screen.getByText("Too dark")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Approve" }));
    const approve = screen.getByRole("button", { name: "Approve face video" });
    expect(approve).toBeDisabled();
    for (const check of [
      "The same real person all along, not a photo or a screen",
      "Each challenge is done, in the order asked",
      "The face is clear: good light, nothing covering it",
    ]) {
      await user.click(screen.getByRole("checkbox", { name: check }));
    }
    await user.click(approve);

    expect(await screen.findByText("Decision saved. We emailed Nadia.")).toBeInTheDocument();
    expect(decisions).toEqual([{ faceCheck: { decision: "approved" } }]);
    expect(screen.getByText("No face video is waiting.")).toBeInTheDocument();
  });

  it("rejects with a reason the user reads", async () => {
    const user = userEvent.setup();
    const decisions = adminApi();
    renderApp("/admin/verifications/21");

    await user.click(await screen.findByRole("radio", { name: "Reject" }));
    await user.click(screen.getByRole("button", { name: "Too dark" }));
    await user.click(screen.getByRole("button", { name: "Reject face video" }));

    expect(await screen.findByText("Decision saved. We emailed Nadia.")).toBeInTheDocument();
    expect(decisions).toEqual([
      {
        faceCheck: {
          decision: "rejected",
          reason: "We can't see your face well: it's too dark. Record again facing a window or a lamp.",
        },
      },
    ]);
  });

  it("sends a mechanic's documents to Mechanic checks for now", async () => {
    const user = userEvent.setup();
    adminApi({
      ...buyerReview,
      user: { ...buyerReview.user, id: 7, firstName: "Hamid", lastName: "Mansouri", role: "mechanic" },
      documents: {
        kind: "solo",
        status: "pending",
        bookable: false,
        validUntil: null,
        requiredTypes: ["cin_front", "cin_back"],
        expiringTypes: ["cin_front", "cin_back", "patente"],
        documents: [
          {
            id: 11,
            type: "cin_front",
            status: "pending",
            contentType: "image/jpeg",
            sizeBytes: 1000,
            validUntil: null,
            expired: false,
            rejectionReason: null,
            submittedAt: "2026-11-17T09:00:00.000Z",
            reviewedAt: null,
            createdAt: "2026-11-17T09:00:00.000Z",
          },
        ],
      },
    });
    renderApp("/admin/verifications/7");

    expect(await screen.findByText("1 document waiting")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Mechanic checks" })).toHaveAttribute("href", "/admin/mechanics?mechanic=7");
    await user.click(screen.getByRole("radio", { name: "Reject" }));
    await user.type(screen.getByLabelText("Reason for rejecting the face video"), "Too dark");
    expect(screen.getByRole("button", { name: "Reject face video" })).toBeDisabled();
  });
});
