import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chooseKind, getVerification, removeDocument, submitDocuments, uploadDocument } from "./api";
import type { Verification } from "./api";
import { getDocumentLink } from "./adminApi";

export const verificationKey = ["mechanic-documents", "me"];

export const useVerification = () => useQuery({ queryKey: verificationKey, queryFn: getVerification });

export const useChooseKind = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chooseKind,
    onSuccess: (verification) => queryClient.setQueryData<Verification>(verificationKey, verification),
  });
};

// Uploading or removing a document changes the list, so it is read again.
export const useUploadDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSettled: () => queryClient.invalidateQueries({ queryKey: verificationKey }),
  });
};

export const useRemoveDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeDocument,
    onSettled: () => queryClient.invalidateQueries({ queryKey: verificationKey }),
  });
};

export const useSubmitDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitDocuments,
    onSuccess: (verification) => queryClient.setQueryData<Verification>(verificationKey, verification),
  });
};

// Asked only when the admin opens a document, as each link is logged. The
// link lasts 5 minutes, so it is kept for 4.
export const useDocumentLink = (documentId: number | null) =>
  useQuery({
    queryKey: ["mechanic-documents", "link", documentId],
    queryFn: () => getDocumentLink(documentId ?? 0),
    enabled: documentId !== null,
    staleTime: 4 * 60 * 1000,
    gcTime: 4 * 60 * 1000,
    retry: false,
  });
