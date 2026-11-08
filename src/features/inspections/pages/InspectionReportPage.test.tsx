import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "../../../test/bootstrap";
import { apiErrors, testUser } from "../../../test/handlers";
import { renderApp } from "../../../test/renderApp";
import type { Locale } from "../../../lib/locale";
import type { InspectionStatus, ReportDraft } from "../api";

const inspection = (status: InspectionStatus, reportDraft: ReportDraft | null, reportLanguage: Locale) => ({
  id: 41,
  status,
  car: {
    year: 2021,
    make: { name: "TOYOTA" },
    model: { name: "Corolla" },
    listing: { id: 9, title: "Toyota Corolla Hybrid" },
    photoUrl: null,
  },
  buyer: { firstName: "Amine", lastName: "Takha" },
  reportLanguage,
  reportDraft,
  reportDraftSavedAt: reportDraft ? "2026-11-08T10:15:00.000Z" : null,
});

// The API for one inspection. Records the drafts and reports it gets.
const reportApi = ({
  status = "in_progress" as InspectionStatus,
  draft = null as ReportDraft | null,
  reportError = null as { code: string; message: string; field?: string } | null,
  reportLanguage = "en" as Locale,
} = {}) => {
  const drafts: unknown[] = [];
  const reports: unknown[] = [];
  server.use(
    http.post("*/api/auth/refresh-token", () =>
      HttpResponse.json({ accessToken: "token", user: { ...testUser, role: "mechanic" } }),
    ),
    http.get("*/api/inspections/41", () => HttpResponse.json({ inspection: inspection(status, draft, reportLanguage) })),
    http.get("*/api/inspections", () => HttpResponse.json({ inspections: [] })),
    http.get("*/api/mechanics/me", () => apiErrors(404, { code: "mechanic.profile_not_found", message: "Not found" })),
    http.put("*/api/inspections/41/draft", async ({ request }) => {
      const body = await request.json();
      drafts.push(body);
      return HttpResponse.json({ reportDraft: body, reportDraftSavedAt: "2026-11-08T14:02:00.000Z" });
    }),
    http.post("*/api/inspections/41/report", async ({ request }) => {
      reports.push(await request.json());
      return reportError ? apiErrors(400, reportError) : HttpResponse.json({ inspection: { id: 41 } });
    }),
  );
  return { drafts, reports };
};

// The draft of a report that only misses its last checklist results.
const nearlyDone: ReportDraft = {
  matricule: "45821-B-1",
  mileage: 72410,
  mileageConsistency: "consistent",
  inspectedAt: "2026-11-08T10:20:00.000Z",
  controleTechniqueValid: false,
  vignetteValid: true,
  verdict: "good",
  overallScore: 81,
  summary: "Well maintained.",
  sections: [
    { category: "exterior", items: [{ label: "Body panels and paint", status: "pass" }] },
    {
      category: "mechanical",
      items: [
        { label: "Engine oil and leaks", status: "pass", note: "Clean" },
        { label: "Brake pads and discs", status: null },
      ],
    },
  ],
};

describe("InspectionReportPage", () => {
  it("starts a new report from the default checklist", async () => {
    reportApi();
    renderApp("/inspections/41/report");

    expect(await screen.findByRole("heading", { level: 1, name: "Toyota Corolla Hybrid · 2021" })).toBeInTheDocument();
    expect(screen.getByText("Inspection #41 · In progress")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Exterior" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Body panels and paint")).toBeInTheDocument();
    expect(screen.getByText("0 / 34 items")).toBeInTheDocument();
  });

  it("writes the default checklist in the report's language", async () => {
    reportApi({ reportLanguage: "fr" });
    renderApp("/inspections/41/report");

    expect(await screen.findByText("Carrosserie et peinture")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Exterior" })).toBeInTheDocument();
    expect(screen.getByText("Français").parentElement).toHaveTextContent("Report in Français");
  });

  it("saves the draft, with only the fields filled in", async () => {
    const { drafts } = reportApi();
    const user = userEvent.setup();
    renderApp("/inspections/41/report");

    await user.type(await screen.findByRole("textbox", { name: "Matricule" }), "45821-B-1");
    await user.type(screen.getByRole("textbox", { name: "Mileage (dashboard)" }), "72 410");
    await user.click(screen.getByRole("radio", { name: "Suspicious" }));
    const glass = screen.getByRole("group", { name: "Result for Windscreen and windows" });
    await user.click(within(glass).getByRole("radio", { name: "Attention" }));
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByText(/^Draft saved Today/u)).toBeInTheDocument();
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      matricule: "45821-B-1",
      mileage: 72410,
      mileageConsistency: "suspicious",
      controleTechniqueValid: false,
      vignetteValid: false,
    });
    const [exterior] = (drafts[0] as Required<ReportDraft>).sections;
    expect(exterior?.items[1]).toEqual({ label: "Windscreen and windows", status: "attention" });
    expect(drafts[0]).not.toHaveProperty("summary");
  });

  it("picks up the saved draft", async () => {
    reportApi({ draft: nearlyDone });
    renderApp("/inspections/41/report");

    expect(await screen.findByRole("textbox", { name: "Matricule" })).toHaveValue("45821-B-1");
    expect(screen.getByRole("radio", { name: "Consistent" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Good" })).toBeChecked();
    expect(screen.getByText("2 / 3 items")).toBeInTheDocument();
    expect(screen.getByText("Good condition")).toBeInTheDocument();
  });

  it("says what is missing before submitting", async () => {
    const { reports } = reportApi();
    const user = userEvent.setup();
    renderApp("/inspections/41/report");

    await user.click(await screen.findByRole("button", { name: "Submit report" }));

    expect(await screen.findByText("Check the highlighted fields.")).toBeInTheDocument();
    expect(screen.getByText("Give a result to 34 more checklist items.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Matricule" })).toHaveAccessibleDescription("Fill this in.");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(reports).toEqual([]);
  });

  it("opens the section with an item left to rate", async () => {
    reportApi({ draft: nearlyDone });
    const user = userEvent.setup();
    renderApp("/inspections/41/report");

    await user.click(await screen.findByRole("button", { name: "Submit report" }));

    expect(await screen.findByText("Give a result to 1 more checklist item.")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Mechanical" })).toHaveAttribute("aria-selected", "true");
  });

  it("adds and removes checklist items", async () => {
    reportApi({ draft: nearlyDone });
    const user = userEvent.setup();
    renderApp("/inspections/41/report");

    await user.click(await screen.findByRole("tab", { name: "Mechanical" }));
    await user.click(screen.getByRole("button", { name: "Add item" }));
    const name = screen.getByRole("textbox", { name: "New item name" });
    expect(name).toHaveFocus();
    await user.type(name, "Hybrid battery health");
    const battery = screen.getByRole("group", { name: "Result for Hybrid battery health" });
    await user.click(within(battery).getByRole("radio", { name: "Pass" }));
    await user.click(screen.getByRole("button", { name: "Remove Brake pads and discs" }));

    expect(screen.getByText("3 / 3 items")).toBeInTheDocument();
    expect(screen.queryByText("Brake pads and discs")).not.toBeInTheDocument();
  });

  it("submits the report after asking, then goes back to the queue", async () => {
    const { reports } = reportApi({
      draft: {
        ...nearlyDone,
        sections: [{ category: "mechanical", items: [{ label: "Engine oil and leaks", status: "pass", note: "Clean" }] }],
      },
    });
    const user = userEvent.setup();
    const router = renderApp("/inspections/41/report");

    await user.click(await screen.findByRole("button", { name: "Submit and generate PDF" }));
    const dialog = await screen.findByRole("dialog", { name: "Submit the report?" });
    expect(dialog).toHaveAccessibleDescription(
      "AutoSouk creates the PDF and emails it to Amine T.. You can't change the report afterwards.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Submit report" }));

    await screen.findByRole("heading", { level: 1, name: "Inspection queue" });
    expect(router.state.location.search).toBe("?status=completed");
    expect(reports).toEqual([
      {
        matricule: "45821-B-1",
        mileage: 72410,
        mileageConsistency: "consistent",
        inspectedAt: "2026-11-08T10:20:00.000Z",
        controleTechniqueValid: false,
        vignetteValid: true,
        verdict: "good",
        overallScore: 81,
        summary: "Well maintained.",
        sections: [{ category: "mechanical", items: [{ label: "Engine oil and leaks", status: "pass", note: "Clean" }] }],
      },
    ]);
  });

  it("shows the API's message next to its field", async () => {
    reportApi({
      draft: {
        ...nearlyDone,
        vin: "JTDKB3FU5O3012345",
        sections: [{ category: "exterior", items: [{ label: "Body panels and paint", status: "pass" }] }],
      },
      reportError: { code: "validation.vin_format", message: "Enter a valid VIN.", field: "vin" },
    });
    const user = userEvent.setup();
    renderApp("/inspections/41/report");

    await user.click(await screen.findByRole("button", { name: "Submit report" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Submit report" }));
    expect(await within(dialog).findByText("Enter a valid VIN.")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Keep editing" }));

    expect(screen.getByRole("textbox", { name: "VIN" })).toHaveAccessibleDescription(
      "Enter a valid VIN. 17 characters · no I, O or Q",
    );
  });

  it("takes no report once the inspection is over", async () => {
    reportApi({ status: "completed" });
    renderApp("/inspections/41/report");

    expect(await screen.findByText("This inspection isn't in progress, so it takes no report.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to the queue" })).toHaveAttribute("href", "/inspections");
  });
});
