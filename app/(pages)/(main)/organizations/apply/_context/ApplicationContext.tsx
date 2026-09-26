import React, { createContext, ReactNode, useCallback, useMemo } from "react";
import { FormProvider, useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  useSaveApplication,
  useSubmitApplication,
} from "@/apis/organization-application/saveApplication";
import {
  useRequestApplicationOtp,
  useResolveApplicationEmailLink,
  useVerifyApplicationOtp,
} from "@/apis/organization-application/emailOtp";
import { buildApplicantDocumentUrl } from "@/apis/organization-application/getApplication";
import { uploadApplicationDocument } from "@/apis/organization-application/presignDocument";
import {
  EDITABLE_APPLICATION_STATUSES,
  type ApplicationDocType,
  type IApplication,
  type IApplicationDocument,
} from "@/apis/organization-application/models/application";
import { uploadToCloudinary } from "@/app/(pages)/(main)/incidents/create/_services/upload.service";
import { queryClient } from "@/libs/queryClient";
import { useRouter, useSearchParams } from "@/libs/router";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import {
  ApplicationFormValues,
  ApplicationImageSource,
  applicationToFormValues,
  DEFAULT_APPLICATION_FORM_VALUES,
  toSaveApplicationRequest,
} from "../_services/application.service";

export const APPLICATION_STEPS = [
  "email",
  "profile",
  "contact",
  "owners",
  "documents",
  "review",
] as const;

export type ApplicationStep = (typeof APPLICATION_STEPS)[number];

/** The OTP gate alone: passing it opens the draft editor on its own URL. */
const GATE_STEPS: ApplicationStep[] = ["email"];

/** The draft editor: the mailbox is already proven by the time it opens. */
const EDITOR_STEPS: ApplicationStep[] = [
  "profile",
  "contact",
  "owners",
  "documents",
  "review",
];

export interface ApplicationEditTarget {
  application: IApplication;
  /** Tracking-link token; authorises every save, upload and submit call. */
  trackingToken: string;
}

export const applicationStatusPath = (id: string, token: string) =>
  `/organizations/apply/status/${id}?token=${encodeURIComponent(token)}`;

export const applicationEditPath = (id: string, token: string) =>
  `/organizations/apply/edit/${id}?token=${encodeURIComponent(token)}`;

interface ApplicationContextType {
  form: UseFormReturn<ApplicationFormValues>;
  /** Steps this flow walks through: the email gate, or the draft editor. */
  steps: readonly ApplicationStep[];
  isEditMode: boolean;
  step: ApplicationStep;
  stepIndex: number;
  goToStep: (step: ApplicationStep) => void;
  next: () => Promise<void>;
  back: () => void;

  /** The draft as last saved on the server (editor only). */
  application: IApplication | null;
  /** The address that passed the OTP; it must stay on the owner list. */
  submitterEmail: string;

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
  /** Documents already attached to the draft, and which of them the applicant dropped. */
  existingDocuments: IApplicationDocument[];
  removedDocumentIds: string[];
  toggleExistingDocument: (documentId: string) => void;
  /** Opens a document in a new tab: from memory if picked this session, else from the API. */
  openDocumentPreview: (documentId: string) => void;
  canPreviewDocument: (documentId: string) => boolean;

  /**
   * Saves everything typed so far. Resolves to false when nothing could be saved.
   * `silent` is for the automatic save on "Continue": no toast and no email. The "Save
   * draft" button calls it without options, which also asks the server to mail the
   * submitter a "draft updated" notice (at most once an hour).
   */
  saveDraft: (options?: { silent?: boolean }) => Promise<boolean>;
  isSaving: boolean;
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
  contact: ["contactEmail", "channels"],
  owners: [
    "owners",
    "legalRepPhone",
    "legalRepIdNumber",
  ],
  documents: [],
  review: ["consent"],
};

const isFileSource = (source: ApplicationImageSource): source is File | Blob =>
  typeof source !== "string";

export const ApplicationProvider = ({
  children,
  edit,
}: {
  children: ReactNode;
  edit?: ApplicationEditTarget;
}) => {
  const isEditMode = Boolean(edit);
  const steps = isEditMode ? EDITOR_STEPS : GATE_STEPS;
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkToken = searchParams.get("t") ?? "";
  const trackingToken = edit?.trackingToken ?? "";

  const [application, setApplication] = React.useState<IApplication | null>(
    edit?.application ?? null,
  );
  const [stepIndex, setStepIndex] = React.useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = React.useState<Date | null>(null);
  const [isEmailLocked, setIsEmailLocked] = React.useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = React.useState(false);
  const [isUploadingImages, setIsUploadingImages] = React.useState(false);
  const [removedDocumentIds, setRemovedDocumentIds] = React.useState<string[]>(
    [],
  );
  const existingDocuments = useMemo(
    () => application?.documents ?? [],
    [application],
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
    // The provider mounts once the draft is loaded, so the defaults can carry it.
    defaultValues: edit
      ? applicationToFormValues(edit.application)
      : DEFAULT_APPLICATION_FORM_VALUES,
    mode: "onTouched",
  });

  const step = steps[stepIndex];
  const submitterEmail = application?.submitter_email ?? "";

  const { mutateAsync: requestOtpAsync, isPending: isRequestingOtp } =
    useRequestApplicationOtp();
  const { mutateAsync: verifyOtpAsync, isPending: isVerifyingOtp } =
    useVerifyApplicationOtp();
  const { mutateAsync: saveApplicationAsync, isPending: isSavingDraft } =
    useSaveApplication();
  const { mutateAsync: submitApplicationAsync, isPending: isSubmittingDraft } =
    useSubmitApplication();

  // The mailed link only tells us which address the code went to; the code still has to be
  // typed. It saves an applicant who closed the tab from burning another code.
  const { data: emailLink, isError: isEmailLinkInvalid } =
    useResolveApplicationEmailLink(
      { token: linkToken },
      { enabled: !isEditMode && Boolean(linkToken), staleTime: 0, gcTime: 0 },
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

  /**
   * The code opens this mailbox's draft (or hands back the open application it already has).
   * The editor lives on its own URL with the tracking token, so the draft survives a closed
   * tab — collecting every owner's details can take days.
   */
  const verifyOtp = useCallback(async () => {
    const valid = await form.trigger(["email", "otp"]);
    if (!valid) return;
    const response = await verifyOtpAsync({
      email: form.getValues("email").trim(),
      otp: form.getValues("otp").trim(),
    });
    const { application_id, tracking_token, resumed } = response.data;
    if (resumed) {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Info,
        title: t("You already have an open application; we reopened it"),
      });
    }
    router.push(applicationEditPath(application_id, tracking_token));
  }, [form, router, t, verifyOtpAsync]);

  const goToStep = useCallback(
    (target: ApplicationStep) => {
      setStepIndex(Math.max(steps.indexOf(target), 0));
    },
    [steps],
  );

  /** Uploads picked images so the draft only ever stores URLs. */
  const uploadPendingImages = useCallback(async (): Promise<{
    logoUrl: string;
    backgroundUrl: string;
  } | null> => {
    const { logo, background } = form.getValues();
    if (!isFileSource(logo) && !isFileSource(background)) {
      return { logoUrl: logo, backgroundUrl: background as string };
    }
    setIsUploadingImages(true);
    try {
      // Logo and banner are public branding, so they keep using the public Cloudinary
      // preset. Only the legal paperwork goes to private storage.
      const logoUrl = isFileSource(logo) ? await uploadToCloudinary(logo) : logo;
      const backgroundUrl = isFileSource(background)
        ? await uploadToCloudinary(background)
        : background;
      form.setValue("logo", logoUrl);
      form.setValue("background", backgroundUrl);
      return { logoUrl, backgroundUrl };
    } catch (error) {
      console.error("Image upload failed:", error);
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Error,
        title: t("Could not upload the images, please try again"),
      });
      return null;
    } finally {
      setIsUploadingImages(false);
    }
  }, [form, t]);

  const saveDraft = useCallback(
    async (options?: { silent?: boolean }): Promise<boolean> => {
      if (!application) return false;
      const images = await uploadPendingImages();
      if (!images) return false;

      try {
        const response = await saveApplicationAsync({
          ...toSaveApplicationRequest({
            id: application.id,
            token: trackingToken,
            values: form.getValues(),
            logoUrl: images.logoUrl,
            backgroundUrl: images.backgroundUrl,
            removeDocumentIds: removedDocumentIds,
          }),
          // Only a manual save mails the submitter; "Continue" saves silently.
          notify_submitter: !options?.silent,
        });
        // Uploaded and dropped documents are now part of the saved draft.
        setApplication(response.data.application);
        setRemovedDocumentIds([]);
        form.setValue("documents", []);
        form.setValue("legalRepIdNumber", "");
        if (!options?.silent) {
          showMessage({
            type: MessageType.Toast,
            level: MessageLevel.Success,
            title: response.data.notified
              ? t("Draft saved. We emailed you a link to it")
              : t("Draft saved"),
          });
        }
        return true;
      } catch {
        // `usePost` already showed the error.
        return false;
      }
    },
    [
      application,
      form,
      removedDocumentIds,
      saveApplicationAsync,
      t,
      trackingToken,
      uploadPendingImages,
    ],
  );

  const next = useCallback(async () => {
    const fields = STEP_FIELDS[steps[stepIndex]];
    const valid = fields.length ? await form.trigger(fields) : true;
    if (!valid) return;
    if (isEditMode) {
      const saved = await saveDraft({ silent: true });
      if (!saved) return;
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  }, [form, isEditMode, saveDraft, stepIndex, steps]);

  const back = useCallback(() => {
    setStepIndex((current) => Math.max(current - 1, 0));
  }, []);

  const uploadDocument = useCallback(
    async (file: File, docType: ApplicationDocType) => {
      if (!application) return;
      setIsUploadingDocument(true);
      try {
        const documentId = await uploadApplicationDocument(
          { applicationId: application.id, trackingToken },
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
    [application, form, t, trackingToken],
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
      if (application) {
        return buildApplicantDocumentUrl(
          application.id,
          documentId,
          trackingToken,
        );
      }
      return null;
    },
    [application, localDocumentUrls, trackingToken],
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

  /**
   * Saves, then submits. From here every other owner gets a confirmation email; the
   * application only reaches the review queue once all of them have confirmed.
   */
  const submit = useCallback(async () => {
    if (!application) return;
    const valid = await form.trigger();
    if (!valid) return;

    const saved = await saveDraft({ silent: true });
    if (!saved) return;

    try {
      await submitApplicationAsync({
        id: application.id,
        token: trackingToken,
        consent: form.getValues("consent"),
      });
    } catch {
      return;
    }
    await queryClient.invalidateQueries({
      queryKey: ["organization-application", application.id, trackingToken],
    });
    router.push(applicationStatusPath(application.id, trackingToken));
  }, [application, form, router, saveDraft, submitApplicationAsync, trackingToken]);

  // A draft that is no longer editable (submitted in another tab, say) belongs on the
  // tracking page.
  React.useEffect(() => {
    if (
      application &&
      !EDITABLE_APPLICATION_STATUSES.includes(application.status)
    ) {
      router.replace(applicationStatusPath(application.id, trackingToken));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.status]);

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
      application,
      submitterEmail,
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
      saveDraft,
      isSaving: isSavingDraft || isUploadingImages,
      submit,
      isSubmitting: isSubmittingDraft || isSavingDraft || isUploadingImages,
    }),
    [
      application,
      back,
      canPreviewDocument,
      changeEmail,
      existingDocuments,
      form,
      goToStep,
      isEditMode,
      isEmailLocked,
      isRequestingOtp,
      isSavingDraft,
      isSubmittingDraft,
      isUploadingDocument,
      isUploadingImages,
      isVerifyingOtp,
      next,
      openDocumentPreview,
      otpExpiresAt,
      removeDocument,
      removedDocumentIds,
      requestOtp,
      saveDraft,
      step,
      stepIndex,
      steps,
      submit,
      submitterEmail,
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
