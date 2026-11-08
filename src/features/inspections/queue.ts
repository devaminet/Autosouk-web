import type { InspectionStatus, QueuedInspection } from "./api";

// The queue's columns, in the order a request moves through them. Rejected and
// cancelled requests leave the queue.
export const queueColumns = ["pending", "accepted", "in_progress", "completed"] as const satisfies readonly InspectionStatus[];

export type QueueColumn = (typeof queueColumns)[number];

export const isQueueColumn = (value: string | null): value is QueueColumn =>
  queueColumns.some((column) => column === value);

// The listing's title, or the make and model when the listing is gone.
export const carName = ({ car }: QueuedInspection): string =>
  car.title ?? [car.make?.name, car.model?.name, car.year].filter(Boolean).join(" ");

const day = 86_400_000;

// The queue's figures, counted from its requests.
export const queueStats = (inspections: QueuedInspection[], now: Date) => {
  const since = (days: number) => now.getTime() - days * day;
  const requestedBetween = (from: number, to: number) =>
    inspections.filter(({ requestedAt }) => {
      const time = new Date(requestedAt).getTime();
      return time > from && time <= to;
    }).length;
  const completedThisMonth = inspections.filter(({ status, completedAt }) => {
    if (status !== "completed" || !completedAt) {
      return false;
    }
    const completed = new Date(completedAt);
    return completed.getFullYear() === now.getFullYear() && completed.getMonth() === now.getMonth();
  });
  const lastWeek = requestedBetween(since(7), now.getTime());

  return {
    pending: inspections.filter(({ status }) => status === "pending").length,
    lastWeek,
    weekChange: lastWeek - requestedBetween(since(14), since(7)),
    completedThisMonth: completedThisMonth.length,
    earnedThisMonth: completedThisMonth.reduce((sum, { priceAtRequest }) => sum + priceAtRequest, 0),
  };
};
