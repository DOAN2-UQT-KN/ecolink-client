import React, { createContext, ReactNode, useCallback, useMemo } from "react";
import { FormProvider, useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  useCreateApplication,
  useUpdateApplication,
} from "@/apis/organization-application/createApplication";
import {
  useRequestApplicationOtp,
  useResolveApplicationEmailLink,
  useVerifyApplicationOtp,
} from "@/apis/organization-application/emailOtp";
import { buildApplicantDocumentUrl } from "@/apis/organization-application/getApplication";
import { uploadApplicationDocument } from "@/apis/organization-application/presignDocument";
import type {
  ApplicationDocType,
  IApplication,
  IApplicationDocument,
} from "@/apis/organization-application/models/application";
import { uploadToCloudinary } from "@/app/(pages)/(main)/incidents/create/_services/upload.service";
import { queryClient } from "@/libs/queryClient";
import { useRouter, useSearchParams } from "@/libs/router";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import {
  ApplicationFormValues,
  applicationToFormValues,
  DEFAULT_APPLICATION_FORM_VALUES,
  toCreateApplicationRequest,
} from "../_services/application.service";

export const APPLICATION_STEPS = [
  "email",
  "profile",
  "contact",
  "documents",
  "review",
] as const;

export type ApplicationStep = (typeof APPLICATION_STEPS)[number];

/** Resubmitting after a reviewer asked for more: the mailbox is already proven. */
const EDIT_STEPS: ApplicationStep[] = ["profile", "contact", "documents", "review"];

export interface ApplicationEditTarget {
  application: IApplication;
  /** Tracking-link token; authorises the upload and resubmit calls. */
  trackingToken: string;
}

interface ApplicationContextType {
  form: UseFormReturn<ApplicationFormValues>;
  /** Steps this flow walks through; edit mode skips the email gate. */
  steps: readonly ApplicationStep[];
  isEditMode: boolean;
  step: ApplicationStep;
  stepIndex: number;
  goToStep: (step: ApplicationStep) => void;
  next: () => Promise<void>;
  back: () => void;

  /** Set once the emailed code has been accepted; unlocks every later step. */
  submissionToken: string;
  /** When the latest code stops working; `null` until one has been sent. */
  otpExpiresAt: Date | null;
  /** True when the form was reopened from the mailed link, so the address is fixed. */
  isEmailLocked: boolean;
  /** Drops the sent code so another address can be entered (not offered when locked). */
  changeEmail: () => void;
  requestOtp: () => Promise<void>;
  verifyOtp: () => Promise<void>;
  isRequestingOtp: boolean;
  isVerifyingOtp: boolean;

  uploadDocument: (file: File, docType: ApplicationDocType) => Promise<void>;
  removeDocument: (documentId: string) => void;
  isUploadingDocument: boolean;
  /** Edit mode only: what was attached before, and which of it the applicant dropped. */
  existingDocuments: IApplicationDocument[];
  removedDocumentIds: string[];
  toggleExistingDocument: (documentId: string) => void;
  /** Opens a document in a new tab: from memory if picked this session, else from the API. */
  openDocumentPreview: (documentId: string) => void;
  /** False when there is nothing to open (e.g. a new application's server-side copy). */
  canPreviewDocument: (documentId: string) => boolean;

  submit: () => Promise<void>;
  isSubmitting: boolean;
}

export const ApplicationContext = createContext<
  ApplicationContextType | undefined
>(undefined);

/** Fields each step owns, so "Continue" only validates what is on screen. */
const STEP_FIELDS: Record<ApplicationStep, (keyof ApplicationFormValues)[]> = {
  email: ["email"],
  profile: ["orgType", "name", "address", "latitude", "longitude", "logo"],
  contact: ["channels", "legalRepFullName", "legalRepIdNumber", "legalRepPhone"],
  documents: [],
  review: ["consent"],
};

export const ApplicationProvider = ({
  children,
  edit,
}: {
  children: ReactNode;
  edit?: ApplicationEditTarget;
}) => {
  const isEditMode = Boolean(edit);
  const steps = isEditMode ? EDIT_STEPS : APPLICATION_STEPS;
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkToken = searchParams.get("t") ?? "";

  const [stepIndex, setStepIndex] = React.useState(0);
  const [submissionToken, setSubmissionToken] = React.useState("");
  const [otpExpiresAt, setOtpExpiresAt] = React.useState<Date | null>(null);
  const [isEmailLocked, setIsEmailLocked] = React.useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = React.useState(false);
  const [isUploadingImages, setIsUploadingImages] = React.useState(false);
  const [removedDocumentIds, setRemovedDocumentIds] = React.useState<string[]>(
    [],
  );
  const existingDocuments = useMemo(
    () => edit?.application.documents ?? [],
    [edit],
  );
  // Object URLs for files picked in this session, so they preview without a server round trip.
  const [localDocumentUrls, setLocalDocumentUrls] = React.useState<
    Record<string, string>
  >({});
  const localDocumentUrlsRef = React.useRef(localDocumentUrls);
  localDocumentUrlsRef.current = localDocumentUrls;
  React.useEffect(
    () => () => {
      Object.values(localDocumentUrlsRef.current).forEach((objectUrl) =>
        URL.revokeObjectURL(objectUrl),
      );
    },
    [],
  );

  const form = useForm<ApplicationFormValues>({
    // The provider mounts once the application is loaded, so the defaults can carry it.
    defaultValues: edit
      ? applicationToFormValues(edit.application)
      : DEFAULT_APPLICATION_FORM_VALUES,
    mode: "onTouched",
  });

  const step = steps[stepIndex];

  const { mutateAsync: requestOtpAsync, isPending: isRequestingOtp } =
    useRequestApplicationOtp();
  const { mutateAsync: verifyOtpAsync, isPending: isVerifyingOtp } =
    useVerifyApplicationOtp();
  const { mutateAsync: createApplicationAsync, isPending: isCreating } =
    useCreateApplication();
  const { mutateAsync: updateApplicationAsync, isPending: isUpdating } =
    useUpdateApplication({ messageSuccess: undefined });

  // The mailed link only tells us which address the code went to; the code still has to be
  // typed. It saves an applicant who closed the tab from burning another code.
  const { data: emailLink, isError: isEmailLinkInvalid } =
    useResolveApplicationEmailLink(
      { token: linkToken },
      { enabled: Boolean(linkToken), staleTime: 0, gcTime: 0 },
    );

  React.useEffect(() => {
    if (!emailLink?.data) return;
    form.setValue("email", emailLink.data.email);
    setOtpExpiresAt(new Date(emailLink.data.expires_at));
    setIsEmailLocked(true);
  }, [emailLink, form]);

  React.useEffect(() => {
    if (!isEmailLinkInvalid) return;
    showMessage({
      type: MessageType.Toast,
      level: MessageLevel.Error,
      title: t("This link has expired, please request a new code"),
    });
    router.replace("/organizations/apply");
    // `router` is rebuilt every render; only a new failure should toast again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmailLinkInvalid, t]);

  const requestOtp = useCallback(async () => {
    const valid = await form.trigger("email");
    if (!valid) return;
    const response = await requestOtpAsync({
      email: form.getValues("email").trim(),
    });
    setOtpExpiresAt(new Date(response.data.expires_at));
    form.setValue("otp", "");
  }, [form, requestOtpAsync]);

  const changeEmail = useCallback(() => {
    setOtpExpiresAt(null);
    form.setValue("otp", "");
    form.clearErrors("otp");
  }, [form]);

  const verifyOtp = useCallback(async () => {
    const valid = await form.trigger(["email", "otp"]);
    if (!valid) return;
    const response = await verifyOtpAsync({
      email: form.getValues("email").trim(),
      otp: form.getValues("otp").trim(),
    });
    setSubmissionToken(response.data.submission_token);
    setStepIndex((current) => current + 1);
  }, [form, verifyOtpAsync]);

  const goToStep = useCallback(
    (target: ApplicationStep) => {
      setStepIndex(Math.max(steps.indexOf(target), 0));
    },
    [steps],
  );

  const next = useCallback(async () => {
    const fields = STEP_FIELDS[steps[stepIndex]];
    const valid = fields.length ? await form.trigger(fields) : true;
    if (!valid) return;
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [form, stepIndex, steps]);

  const back = useCallback(() => {
    // In the new-application flow step 0 is the OTP gate; once past it there is no going back
    // to re-verify, because the submission token is bound to the address already confirmed.
    const firstStep = isEditMode ? 0 : 1;
    setStepIndex((current) => Math.max(current - 1, firstStep));
  }, [isEditMode]);

  const uploadDocument = useCallback(
    async (file: File, docType: ApplicationDocType) => {
      const credential = edit
        ? {
            applicationId: edit.application.id,
            trackingToken: edit.trackingToken,
          }
        : submissionToken
          ? { submissionToken }
          : null;
      if (!credential) return;
      setIsUploadingDocument(true);
      try {
        const documentId = await uploadApplicationDocument(
          credential,
          file,
          docType,
        );
        form.setValue(
          "documents",
          [
            ...form.getValues("documents"),
            { documentId, fileName: file.name, docType, mimeType: file.type },
          ],
          { shouldDirty: true },
        );
        const objectUrl = URL.createObjectURL(file);
        setLocalDocumentUrls((current) => ({
          ...current,
          [documentId]: objectUrl,
        }));
      } catch (error) {
        console.error("Document upload failed:", error);
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t("Could not upload the document, please try again"),
        });
      } finally {
        setIsUploadingDocument(false);
      }
    },
    [edit, form, submissionToken, t],
  );

  const toggleExistingDocument = useCallback((documentId: string) => {
    setRemovedDocumentIds((current) =>
      current.includes(documentId)
        ? current.filter((id) => id !== documentId)
        : [...current, documentId],
    );
  }, []);

  const documentPreviewUrl = useCallback(
    (documentId: string): string | null => {
      if (localDocumentUrls[documentId]) return localDocumentUrls[documentId];
      if (edit) {
        return buildApplicantDocumentUrl(
          edit.application.id,
          documentId,
          edit.trackingToken,
        );
      }
      return null;
    },
    [edit, localDocumentUrls],
  );

  const canPreviewDocument = useCallback(
    (documentId: string) => documentPreviewUrl(documentId) !== null,
    [documentPreviewUrl],
  );

  const openDocumentPreview = useCallback(
    (documentId: string) => {
      const previewUrl = documentPreviewUrl(documentId);
      if (previewUrl) window.open(previewUrl, "_blank", "noopener,noreferrer");
    },
    [documentPreviewUrl],
  );

  const removeDocument = useCallback(
    (documentId: string) => {
      setLocalDocumentUrls((current) => {
        if (!current[documentId]) return current;
        URL.revokeObjectURL(current[documentId]);
        const { [documentId]: _removed, ...rest } = current;
        return rest;
      });
      form.setValue(
        "documents",
        form.getValues("documents").filter((d) => d.documentId !== documentId),
        { shouldDirty: true },
      );
    },
    [form],
  );

  const submit = useCallback(async () => {
    const valid = await form.trigger();
    if (!valid || (!edit && !submissionToken)) return;

    const values = form.getValues();
    setIsUploadingImages(true);
    let logoUrl = "";
    let backgroundUrl = "";
    try {
      // Logo and banner are public branding, so they keep using the public Cloudinary
      // preset. Only the legal paperwork goes to private storage.
      logoUrl = await uploadToCloudinary(values.logo || "");
      backgroundUrl = values.background
        ? await uploadToCloudinary(values.background)
        : "";
    } catch (error) {
      console.error("Image upload failed:", error);
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Error,
        title: t("Could not upload the images, please try again"),
      });
      return;
    } finally {
      setIsUploadingImages(false);
    }

    const request = toCreateApplicationRequest({ values, logoUrl, backgroundUrl });

    if (edit) {
      const { id } = edit.application;
      const token = edit.trackingToken;
      // `consent` belongs to the first submission only; the resubmit endpoint ignores it.
      const { consent: _consent, ...changes } = request;
      await updateApplicationAsync({
        id,
        token,
        ...changes,
        remove_document_ids: removedDocumentIds,
      });
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Success,
        title: t("Application resubmitted"),
      });
      await queryClient.invalidateQueries({
        queryKey: ["organization-application", id, token],
      });
      router.push(
        `/organizations/apply/status/${id}?token=${encodeURIComponent(token)}`,
      );
      return;
    }

    const response = await createApplicationAsync({
      submissionToken,
      data: request,
    });

    // The tracking link also goes out by email; this takes the applicant straight there.
    const params = new URLSearchParams({
      id: response.data.application.id,
      token: response.data.tracking_token,
    });
    router.push(`/organizations/apply/submitted?${params.toString()}`);
  }, [
    createApplicationAsync,
    edit,
    form,
    removedDocumentIds,
    router,
    submissionToken,
    t,
    updateApplicationAsync,
  ]);

  const contextValue = useMemo(
    () => ({
      form,
      steps,
      isEditMode,
      step,
      stepIndex,
      goToStep,
      next,
      back,
      submissionToken,
      otpExpiresAt,
      isEmailLocked,
      changeEmail,
      requestOtp,
      verifyOtp,
      isRequestingOtp,
      isVerifyingOtp,
      uploadDocument,
      removeDocument,
      isUploadingDocument,
      existingDocuments,
      removedDocumentIds,
      toggleExistingDocument,
      openDocumentPreview,
      canPreviewDocument,
      submit,
      isSubmitting: isCreating || isUpdating || isUploadingImages,
    }),
    [
      back,
      canPreviewDocument,
      changeEmail,
      existingDocuments,
      form,
      goToStep,
      isCreating,
      isEditMode,
      isEmailLocked,
      isUpdating,
      isRequestingOtp,
      isUploadingDocument,
      isUploadingImages,
      isVerifyingOtp,
      next,
      openDocumentPreview,
      otpExpiresAt,
      removeDocument,
      removedDocumentIds,
      requestOtp,
      step,
      stepIndex,
      steps,
      submissionToken,
      submit,
      toggleExistingDocument,
      uploadDocument,
      verifyOtp,
    ],
  );

  return (
    <ApplicationContext.Provider value={contextValue}>
      <FormProvider {...form}>{children}</FormProvider>
    </ApplicationContext.Provider>
  );
};
