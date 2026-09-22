import React, { createContext, ReactNode, useCallback, useMemo } from "react";
import { FormProvider, useForm, UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useCreateApplication } from "@/apis/organization-application/createApplication";
import {
  useRequestApplicationOtp,
  useVerifyApplicationOtp,
} from "@/apis/organization-application/emailOtp";
import { uploadApplicationDocument } from "@/apis/organization-application/presignDocument";
import type { ApplicationDocType } from "@/apis/organization-application/models/application";
import { uploadToCloudinary } from "@/app/(pages)/(main)/incidents/create/_services/upload.service";
import { useRouter } from "@/libs/router";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import {
  ApplicationFormValues,
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

interface ApplicationContextType {
  form: UseFormReturn<ApplicationFormValues>;
  step: ApplicationStep;
  stepIndex: number;
  goToStep: (step: ApplicationStep) => void;
  next: () => Promise<void>;
  back: () => void;

  /** Set once the emailed code has been accepted; unlocks every later step. */
  submissionToken: string;
  otpSentAt: Date | null;
  requestOtp: () => Promise<void>;
  verifyOtp: () => Promise<void>;
  isRequestingOtp: boolean;
  isVerifyingOtp: boolean;

  uploadDocument: (file: File, docType: ApplicationDocType) => Promise<void>;
  removeDocument: (documentId: string) => void;
  isUploadingDocument: boolean;

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

export const ApplicationProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const [stepIndex, setStepIndex] = React.useState(0);
  const [submissionToken, setSubmissionToken] = React.useState("");
  const [otpSentAt, setOtpSentAt] = React.useState<Date | null>(null);
  const [isUploadingDocument, setIsUploadingDocument] = React.useState(false);
  const [isUploadingImages, setIsUploadingImages] = React.useState(false);

  const form = useForm<ApplicationFormValues>({
    defaultValues: DEFAULT_APPLICATION_FORM_VALUES,
    mode: "onTouched",
  });

  const step = APPLICATION_STEPS[stepIndex];

  const { mutateAsync: requestOtpAsync, isPending: isRequestingOtp } =
    useRequestApplicationOtp();
  const { mutateAsync: verifyOtpAsync, isPending: isVerifyingOtp } =
    useVerifyApplicationOtp();
  const { mutateAsync: createApplicationAsync, isPending: isCreating } =
    useCreateApplication();

  const requestOtp = useCallback(async () => {
    const valid = await form.trigger("email");
    if (!valid) return;
    await requestOtpAsync({ email: form.getValues("email").trim() });
    setOtpSentAt(new Date());
  }, [form, requestOtpAsync]);

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

  const goToStep = useCallback((target: ApplicationStep) => {
    setStepIndex(APPLICATION_STEPS.indexOf(target));
  }, []);

  const next = useCallback(async () => {
    const fields = STEP_FIELDS[APPLICATION_STEPS[stepIndex]];
    const valid = fields.length ? await form.trigger(fields) : true;
    if (!valid) return;
    setStepIndex((current) => Math.min(current + 1, APPLICATION_STEPS.length - 1));
  }, [form, stepIndex]);

  const back = useCallback(() => {
    // Step 0 is the OTP gate; once past it there is no going back to re-verify, because the
    // submission token is bound to the address that was already confirmed.
    setStepIndex((current) => Math.max(current - 1, 1));
  }, []);

  const uploadDocument = useCallback(
    async (file: File, docType: ApplicationDocType) => {
      if (!submissionToken) return;
      setIsUploadingDocument(true);
      try {
        const documentId = await uploadApplicationDocument(
          submissionToken,
          file,
          docType,
        );
        form.setValue(
          "documents",
          [
            ...form.getValues("documents"),
            { documentId, fileName: file.name, docType },
          ],
          { shouldDirty: true },
        );
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
    [form, submissionToken, t],
  );

  const removeDocument = useCallback(
    (documentId: string) => {
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
    if (!valid || !submissionToken) return;

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

    const response = await createApplicationAsync({
      submissionToken,
      data: toCreateApplicationRequest({ values, logoUrl, backgroundUrl }),
    });

    // The tracking link also goes out by email; this takes the applicant straight there.
    router.push(
      `/organizations/apply/submitted?code=${encodeURIComponent(
        response.data.application.code,
      )}`,
    );
  }, [createApplicationAsync, form, router, submissionToken, t]);

  const contextValue = useMemo(
    () => ({
      form,
      step,
      stepIndex,
      goToStep,
      next,
      back,
      submissionToken,
      otpSentAt,
      requestOtp,
      verifyOtp,
      isRequestingOtp,
      isVerifyingOtp,
      uploadDocument,
      removeDocument,
      isUploadingDocument,
      submit,
      isSubmitting: isCreating || isUploadingImages,
    }),
    [
      back,
      form,
      goToStep,
      isCreating,
      isRequestingOtp,
      isUploadingDocument,
      isUploadingImages,
      isVerifyingOtp,
      next,
      otpSentAt,
      removeDocument,
      requestOtp,
      step,
      stepIndex,
      submissionToken,
      submit,
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
