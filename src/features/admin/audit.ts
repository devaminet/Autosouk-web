import type { TFunction } from "i18next";
import type { BadgeTone } from "../../components/Badge";
import { formatDate } from "../../lib/format";
import type { AuditEntry } from "./api";

export const knownTargets = ["user", "listing", "identity_verification", "mechanic_document"] as const;

// Removals and refusals in red, approvals in green, views in grey.
export const actionTone = (action: string): BadgeTone => {
  if (/\.(suspended|deleted|rejected)$/u.test(action)) {
    return "danger";
  }
  if (/\.(approved|reactivated)$/u.test(action)) {
    return "success";
  }
  return "neutral";
};

// "Suspended account". An action the client doesn't know shows as sent.
export const actionLabel = (t: TFunction, action: string) => t(`admin:actions.${action}`, { defaultValue: action });

// "User #12", what the entry is about.
export const targetLabel = (t: TFunction, entry: Pick<AuditEntry, "targetType" | "targetId">) =>
  (knownTargets as readonly string[]).includes(entry.targetType)
    ? t(`admin:targets.${entry.targetType}`, { id: entry.targetId })
    : t("admin:targets.other", { type: entry.targetType, id: entry.targetId });

// The reason an admin gave, when there is one.
export const entryReason = (entry: AuditEntry): string | null => {
  const reason = entry.details?.["reason"];
  return typeof reason === "string" ? reason : null;
};

const text = (entry: AuditEntry, key: string): string | null => {
  const value = entry.details?.[key];
  return typeof value === "string" ? value : null;
};

// What the entry kept about its target, such as a deleted account's name and
// email, or a listing's title when it was decided on or deleted.
export const entryKept = (t: TFunction, entry: AuditEntry, locale: string): string | null => {
  if (entry.action === "user.deleted") {
    const name = text(entry, "name");
    const email = text(entry, "email");
    return [name, email].filter(Boolean).join(" · ") || null;
  }
  // A deleted listing, or one approved or rejected and maybe renamed since.
  if (entry.targetType === "listing") {
    return text(entry, "title");
  }
  const validUntil = text(entry, "validUntil");
  return validUntil ? t("admin:auditLog.validUntil", { date: formatDate(validUntil, locale) }) : null;
};
