import { inspectionCategories } from "./api";
import type {
  InspectionCategory,
  ItemStatus,
  MileageConsistency,
  Report,
  ReportDraft,
  Verdict,
} from "./api";

export type FormItem = {
  // Only for the page: tells the rows apart while the mechanic edits them.
  id: string;
  label: string;
  status: ItemStatus | null;
  note: string;
  // Added by the mechanic, so its name can be changed.
  isCustom: boolean;
};

// The report as the form holds it. Inputs keep their text until submit.
export type ReportForm = {
  matricule: string;
  vin: string;
  carteGriseNumber: string;
  mileage: string;
  mileageConsistency: MileageConsistency | null;
  mileageConsistencyNote: string;
  firstRegistrationDate: string;
  // As a datetime-local input shows it: "2026-10-13T11:20", local time.
  inspectedAt: string;
  controleTechniqueValid: boolean;
  controleTechniqueExpiry: string;
  vignetteValid: boolean;
  verdict: Verdict | null;
  overallScore: string;
  summary: string;
  estimatedRepairCost: string;
  sections: Record<InspectionCategory, FormItem[]>;
};

// The checklist every report starts from. Translate with `report.items.<category>.<key>`.
export const defaultItems: Record<InspectionCategory, readonly string[]> = {
  exterior: ["body", "glass", "lights", "tyres", "openings", "mirrors"],
  interior: ["seats", "dashboard", "climate", "controls", "safety", "damp"],
  mechanical: ["oil", "coolant", "belts", "brakes", "gearbox", "exhaust", "start"],
  electrical: ["battery", "codes", "media", "windows", "sensors"],
  under_vehicle: ["suspension", "steering", "rust", "leaks", "driveshafts"],
  road_test: ["engine", "shifting", "braking", "alignment", "rattles"],
};

export const newItem = (label = "", isCustom = true): FormItem => ({
  id: crypto.randomUUID(),
  label,
  status: null,
  note: "",
  isCustom,
});

const pad = (value: number) => String(value).padStart(2, "0");

// "2026-10-13T11:20" in local time, as a datetime-local input takes it.
export const toLocalInput = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

const toIso = (localInput: string): string | undefined => {
  const date = new Date(localInput);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

// A new report: the default checklist, inspected now.
export const emptyForm = (itemLabel: (category: InspectionCategory, key: string) => string, now: Date): ReportForm => ({
  matricule: "",
  vin: "",
  carteGriseNumber: "",
  mileage: "",
  mileageConsistency: null,
  mileageConsistencyNote: "",
  firstRegistrationDate: "",
  inspectedAt: toLocalInput(now),
  controleTechniqueValid: false,
  controleTechniqueExpiry: "",
  vignetteValid: false,
  verdict: null,
  overallScore: "",
  summary: "",
  estimatedRepairCost: "",
  sections: Object.fromEntries(
    inspectionCategories.map((category) => [
      category,
      defaultItems[category].map((key) => newItem(itemLabel(category, key), false)),
    ]),
  ) as Record<InspectionCategory, FormItem[]>,
});

const text = (value: number | undefined) => (value === undefined ? "" : String(value));

// The saved draft over a new report. A draft keeps every section it had.
export const formFromDraft = (draft: ReportDraft, start: ReportForm): ReportForm => {
  const sections = { ...start.sections };
  if (draft.sections) {
    for (const category of inspectionCategories) {
      sections[category] = [];
    }
    for (const { category, items } of draft.sections) {
      sections[category] = items.map(({ label, status, note }) => ({
        ...newItem(label, false),
        status,
        note: note ?? "",
      }));
    }
  }
  return {
    matricule: draft.matricule ?? start.matricule,
    vin: draft.vin ?? start.vin,
    carteGriseNumber: draft.carteGriseNumber ?? start.carteGriseNumber,
    mileage: text(draft.mileage),
    mileageConsistency: draft.mileageConsistency ?? null,
    mileageConsistencyNote: draft.mileageConsistencyNote ?? "",
    firstRegistrationDate: draft.firstRegistrationDate ?? "",
    inspectedAt: draft.inspectedAt ? toLocalInput(new Date(draft.inspectedAt)) : start.inspectedAt,
    controleTechniqueValid: draft.controleTechniqueValid ?? false,
    controleTechniqueExpiry: draft.controleTechniqueExpiry ?? "",
    vignetteValid: draft.vignetteValid ?? false,
    verdict: draft.verdict ?? null,
    overallScore: text(draft.overallScore),
    summary: draft.summary ?? "",
    estimatedRepairCost: text(draft.estimatedRepairCost),
    sections,
  };
};

const filled = (value: string) => {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
};

const whole = (value: string) => (value === "" ? undefined : Number(value));

// The fields both the draft and the report send, without the empty ones.
const commonFields = (form: ReportForm) => ({
  vin: filled(form.vin)?.toUpperCase(),
  carteGriseNumber: filled(form.carteGriseNumber),
  mileageConsistencyNote: filled(form.mileageConsistencyNote),
  firstRegistrationDate: filled(form.firstRegistrationDate),
  inspectedAt: toIso(form.inspectedAt),
  controleTechniqueValid: form.controleTechniqueValid,
  // An expiry only means something on a valid contrôle technique.
  controleTechniqueExpiry: form.controleTechniqueValid ? filled(form.controleTechniqueExpiry) : undefined,
  vignetteValid: form.vignetteValid,
  estimatedRepairCost: whole(form.estimatedRepairCost),
});

export const draftFromForm = (form: ReportForm): ReportDraft => ({
  ...commonFields(form),
  matricule: filled(form.matricule),
  mileage: whole(form.mileage),
  mileageConsistency: form.mileageConsistency ?? undefined,
  verdict: form.verdict ?? undefined,
  overallScore: whole(form.overallScore),
  summary: filled(form.summary),
  sections: inspectionCategories.map((category) => ({
    category,
    items: form.sections[category].map(({ label, status, note }) => ({
      label: label.trim(),
      status,
      note: filled(note),
    })),
  })),
});

export type FieldName = "matricule" | "mileage" | "mileageConsistency" | "verdict" | "overallScore" | "summary";

// The message keys of the problems the form finds before submitting.
export type FormProblems = {
  fields: Partial<Record<FieldName, "required" | "consistency" | "verdict" | "score">>;
  // By item id.
  items: Record<string, "itemLabel" | "status">;
  unrated: number;
  noItems: boolean;
};

const allItems = (form: ReportForm) => inspectionCategories.flatMap((category) => form.sections[category]);

// Checks the form, then builds the report the API takes.
export const reportFromForm = (form: ReportForm): { report: Report } | { problems: FormProblems } => {
  const problems: FormProblems = { fields: {}, items: {}, unrated: 0, noItems: false };
  const matricule = filled(form.matricule);
  const mileage = whole(form.mileage);
  const score = whole(form.overallScore);
  const summary = filled(form.summary);
  if (!matricule) problems.fields.matricule = "required";
  if (mileage === undefined) problems.fields.mileage = "required";
  if (!form.mileageConsistency) problems.fields.mileageConsistency = "consistency";
  if (!form.verdict) problems.fields.verdict = "verdict";
  if (score === undefined || score > 100) problems.fields.overallScore = "score";
  if (!summary) problems.fields.summary = "required";
  const items = allItems(form);
  problems.noItems = items.length === 0;
  for (const item of items) {
    if (!item.label.trim()) {
      problems.items[item.id] = "itemLabel";
    } else if (!item.status) {
      problems.items[item.id] = "status";
      problems.unrated += 1;
    }
  }

  const hasProblems =
    Object.keys(problems.fields).length > 0 || Object.keys(problems.items).length > 0 || problems.noItems;
  if (
    hasProblems ||
    !matricule ||
    mileage === undefined ||
    !form.mileageConsistency ||
    !form.verdict ||
    score === undefined ||
    !summary
  ) {
    return { problems };
  }

  return {
    report: {
      ...commonFields(form),
      matricule,
      mileage,
      mileageConsistency: form.mileageConsistency,
      verdict: form.verdict,
      overallScore: score,
      summary,
      sections: inspectionCategories.flatMap((category) => {
        const rated = form.sections[category].flatMap(({ label, status, note }) =>
          status ? [{ label: label.trim(), status, note: filled(note) }] : [],
        );
        // The API takes no empty section.
        return rated.length > 0 ? [{ category, items: rated }] : [];
      }),
    },
  };
};

// The figures the summary card shows as the mechanic fills the form in.
export const formProgress = (form: ReportForm) => {
  const items = allItems(form);
  const count = (status: ItemStatus) => items.filter((item) => item.status === status).length;
  const rated = items.filter((item) => item.status !== null).length;
  return {
    pass: count("pass"),
    attention: count("attention"),
    fail: count("fail"),
    rated,
    total: items.length,
    steps: {
      identity: filled(form.matricule) !== undefined && form.mileage !== "",
      mileage: form.mileageConsistency !== null,
      papers: !form.controleTechniqueValid || form.controleTechniqueExpiry !== "",
      checklist: items.length > 0 && rated === items.length,
      summary: filled(form.summary) !== undefined && form.verdict !== null && form.overallScore !== "",
    },
  };
};

// Whether every item of a section has its result.
export const isSectionDone = (items: FormItem[]) => items.length > 0 && items.every(({ status }) => status !== null);
