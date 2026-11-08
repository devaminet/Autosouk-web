import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCityGarages,
  getInspection,
  getQueue,
  moveInspection,
  requestInspection,
  saveReportDraft,
  submitReport,
} from "./api";
import type { Inspection, ReportDraft, Report } from "./api";

export const useCityGarages = (cityId: number, enabled: boolean) =>
  useQuery({
    queryKey: ["garages", "city", cityId],
    queryFn: () => getCityGarages(cityId),
    enabled,
  });

export const useRequestInspection = () => useMutation({ mutationFn: requestInspection });

const queueKey = ["inspections", "queue"];

export const useQueue = (enabled: boolean) => useQuery({ queryKey: queueKey, queryFn: getQueue, enabled });

export const useMoveInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moveInspection,
    // Reload either way: a failed move may mean the buyer cancelled meanwhile.
    onSettled: () => queryClient.invalidateQueries({ queryKey: queueKey }),
  });
};

const inspectionKey = (id: number) => ["inspections", id];

export const useInspection = (id: number | null) =>
  useQuery({
    queryKey: inspectionKey(id ?? 0),
    queryFn: () => getInspection(id ?? 0),
    enabled: id !== null,
  });

export const useSaveReportDraft = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: ReportDraft) => saveReportDraft({ id, draft }),
    onSuccess: (savedAt, draft) =>
      queryClient.setQueryData<Inspection>(inspectionKey(id), (previous) =>
        previous ? { ...previous, reportDraft: draft, reportDraftSavedAt: savedAt } : previous,
      ),
  });
};

export const useSubmitReport = (id: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (report: Report) => submitReport({ id, report }),
    // The page leaves for the queue, so the report page doesn't reload first.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queueKey });
      void queryClient.invalidateQueries({ queryKey: inspectionKey(id), refetchType: "none" });
    },
  });
};
