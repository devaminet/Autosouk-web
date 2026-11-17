import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors, storageResponse, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";
import { documentsByKind } from "../api";
import type { DocumentType, MechanicKind, Verification } from "../api";

type Doc = Verification["documents"][number];

const doc = (type: DocumentType, status: Doc["status"], extra: Partial<Doc> = {}): Doc => ({
  id: Math.floor(Math.random() * 100_000),
  type,
  status,
  contentType: "application/pdf",
  sizeBytes: 1_258_291,
  validUntil: null,
  expired: false,
  rejectionReason: null,
  submittedAt: null,
  reviewedAt: null,
  createdAt: "2026-11-16T10:00:00.000Z",
  ...extra,
});

// A signed-in mechanic and a small stand-in for the documents API.
const documentsApi = (initial: Partial<Verification> = {}) => {
  let state: Verification = {
    kind: null,
    status: "not_submitted",
    bookable: false,
    approvedAt: null,
    validUntil: null,
    requiredTypes: [],
    documents: [],
    ...initial,
  };
  const sent = { kinds: [] as MechanicKind[], uploads: [] as unknown[], submitted: 0 };
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "mechanic" } }),
    ),
    http.get("*/api/mechanic-documents/me", () => HttpResponse.json(state)),
    http.put("*/api/mechanic-documents/me/kind", async ({ request }) => {
      const { kind } = (await request.json()) as { kind: MechanicKind };
      sent.kinds.push(kind);
      state = { ...state, kind, requiredTypes: [...documentsByKind[kind]] };
      return HttpResponse.json(state);
    }),
    http.post("*/api/mechanic-documents/me/documents", async ({ request }) => {
      const body = (await request.json()) as { type: DocumentType };
      sent.uploads.push(body);
      return HttpResponse.json(
        { document: { id: 50, type: body.type, expiresAt: "" }, upload: { url: "http://storage.test/docs", fields: { key: "k" } } },
        { status: 201 },
      );
    }),
    http.post("http://storage.test/docs", () => storageResponse(204)),
    http.post("*/api/mechanic-documents/me/documents/50/confirm", () => {
      const uploaded = sent.uploads.at(-1) as { type: DocumentType };
      const document = doc(uploaded.type, "uploaded", { id: 50 });
      state = { ...state, documents: [...state.documents.filter((d) => d.type !== uploaded.type || d.status !== "uploaded"), document] };
      return HttpResponse.json({ document });
    }),
    http.post("*/api/mechanic-documents/me/submit", () => {
      sent.submitted += 1;
      state = {
        ...state,
        status: "pending",
        documents: state.documents.map((d) => (d.status === "uploaded" ? { ...d, status: "pending" } : d)),
      };
      return HttpResponse.json(state);
    }),
  );
  return sent;
};

const pdf = (name = "cin.pdf") => new File(["%PDF"], name, { type: "application/pdf" });

describe("mechanic documents", () => {
  it("chooses solo, uploads both sides of the CIN and sends them", async () => {
    const user = userEvent.setup();
    const sent = documentsApi();
    renderApp("/mechanic/documents");

    expect(await screen.findByRole("heading", { name: "How do you work?" })).toBeInTheDocument();
    await user.click(screen.getByRole("radio", { name: /Solo mechanic/ }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Upload your CIN" })).toBeInTheDocument();
    expect(sent.kinds).toEqual(["solo"]);
    const send = screen.getByRole("button", { name: "Send for review" });
    expect(send).toBeDisabled();

    await user.upload(screen.getByLabelText("Upload CIN · front"), pdf());
    expect(await screen.findByText("1 of 2 ready")).toBeInTheDocument();
    await user.upload(screen.getByLabelText("Upload CIN · back"), pdf());
    expect(await screen.findByText("2 of 2 ready")).toBeInTheDocument();
    expect(sent.uploads).toEqual([
      { type: "cin_front", contentType: "application/pdf" },
      { type: "cin_back", contentType: "application/pdf" },
    ]);

    await user.click(screen.getByRole("button", { name: "Send for review" }));

    expect(await screen.findByRole("heading", { name: "We're checking your documents" })).toBeInTheDocument();
    expect(sent.submitted).toBe(1);
    expect(screen.getByRole("link", { name: "Set up your workshop profile" })).toHaveAttribute("href", "/workshop");
    // The kind is fixed once documents wait for an admin.
    expect(screen.queryByRole("button", { name: "I run a garage instead" })).not.toBeInTheDocument();
  });

  it("opens once the face video is sent, before it is reviewed", async () => {
    documentsApi();
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "mechanic", identityStatus: "pending" } }),
      ),
    );
    renderApp("/mechanic/documents");

    expect(await screen.findByRole("heading", { name: "How do you work?" })).toBeInTheDocument();
  });

  it("waits for the face video first", async () => {
    documentsApi();
    server.use(
      http.post("*/api/auth/refresh-token", () =>
        HttpResponse.json({
          accessToken: "token",
          user: { ...testUser, role: "mechanic", identityStatus: "not_submitted" },
        }),
      ),
    );
    renderApp("/mechanic/documents");

    expect(await screen.findByRole("heading", { name: "Verify your identity first", level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "How do you work?" })).not.toBeInTheDocument();
  });

  it("asks a garage for every document", async () => {
    documentsApi({ kind: "garage", requiredTypes: [...documentsByKind.garage] });
    renderApp("/mechanic/documents");

    const list = within(await screen.findByRole("list", { name: "Your documents" }));
    expect(list.getAllByRole("listitem")).toHaveLength(6);
    expect(list.getByRole("heading", { name: "Lease or title deed" })).toBeInTheDocument();
    expect(screen.getByText("0 of 6 ready")).toBeInTheDocument();
  });

  it("refuses a file the API won't take before uploading it", async () => {
    const user = userEvent.setup({ applyAccept: false });
    const sent = documentsApi({ kind: "solo", requiredTypes: [...documentsByKind.solo] });
    renderApp("/mechanic/documents");

    await user.upload(await screen.findByLabelText("Upload CIN · front"), new File(["x"], "cin.gif", { type: "image/gif" }));
    expect(await screen.findByText("Choose a JPG, PNG or PDF file.")).toBeInTheDocument();

    const big = new File(["x"], "cin.pdf", { type: "application/pdf" });
    Object.defineProperty(big, "size", { value: 11 * 1024 * 1024 });
    await user.upload(screen.getByLabelText("Upload CIN · front"), big);
    expect(await screen.findByText("This file is larger than 10 MB.")).toBeInTheDocument();
    expect(sent.uploads).toEqual([]);
  });

  it("says when the file didn't reach storage", async () => {
    const user = userEvent.setup();
    documentsApi({ kind: "solo", requiredTypes: [...documentsByKind.solo] });
    server.use(http.post("http://storage.test/docs", () => storageResponse(403)));
    renderApp("/mechanic/documents");

    await user.upload(await screen.findByLabelText("Upload CIN · front"), pdf());

    expect(await screen.findByText("The file didn't arrive. Check your connection and upload it again.")).toBeInTheDocument();
  });

  it("shows the reviewer's reason and lets the mechanic replace the document", async () => {
    const user = userEvent.setup();
    const sent = documentsApi({
      kind: "garage",
      status: "rejected",
      requiredTypes: [...documentsByKind.garage],
      documents: [
        ...documentsByKind.garage.filter((type) => type !== "patente").map((type) => doc(type, "approved")),
        doc("patente", "rejected", { rejectionReason: "Expired on 31 Dec 2025" }),
      ],
    });
    renderApp("/mechanic/documents");

    expect(await screen.findByRole("heading", { name: "A document needs a fix" })).toBeInTheDocument();
    expect(screen.getByText("Expired on 31 Dec 2025")).toBeInTheDocument();
    expect(screen.getByText("5 of 6 ready")).toBeInTheDocument();

    await user.upload(screen.getByLabelText("Replace Patente"), pdf("patente.pdf"));
    await waitFor(() => expect(screen.getByRole("button", { name: "Send again" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "Send again" }));

    expect(await screen.findByRole("heading", { name: "We're checking your documents" })).toBeInTheDocument();
    expect(sent.uploads).toEqual([{ type: "patente", contentType: "application/pdf" }]);
  });

  it("tells an approved mechanic until when buyers can book them", async () => {
    documentsApi({
      kind: "solo",
      status: "approved",
      bookable: true,
      validUntil: "2031-03-14",
      requiredTypes: [...documentsByKind.solo],
      documents: [doc("cin_front", "approved", { validUntil: "2031-03-14" }), doc("cin_back", "approved", { validUntil: "2031-03-14" })],
    });
    renderApp("/mechanic/documents");

    expect(await screen.findByRole("heading", { name: "You're a verified mechanic" })).toBeInTheDocument();
    expect(screen.getByText("Buyers can book you until Mar 14, 2031. Upload the new document before then.")).toBeInTheDocument();
    expect(screen.getAllByText("Valid until Mar 14, 2031")).toHaveLength(2);
  });

  it("shows the API's message when sending fails", async () => {
    const user = userEvent.setup();
    documentsApi({
      kind: "solo",
      requiredTypes: [...documentsByKind.solo],
      documents: [doc("cin_front", "uploaded"), doc("cin_back", "uploaded")],
    });
    server.use(
      http.post("*/api/mechanic-documents/me/submit", () =>
        apiErrors(400, { code: "mechanic_documents.incomplete", message: "1 document is still missing" }),
      ),
    );
    renderApp("/mechanic/documents");

    await user.click(await screen.findByRole("button", { name: "Send for review" }));

    expect(await screen.findByText("1 document is still missing")).toBeInTheDocument();
  });
});
