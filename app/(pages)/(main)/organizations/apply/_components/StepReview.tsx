import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox } from "@/components/ui/checkbox";
import { FieldError } from "@/components/ui/field";
import {
  CHANNEL_TYPE_OPTIONS,
  DOC_TYPE_OPTIONS,
  ORG_TYPE_OPTIONS,
} from "../_services/application.service";
import { useApplication } from "../_hooks/useApplication";
import { SummaryRow } from "./ApplicationDetails";
import { DocumentNameLink } from "./DocumentNameLink";

export const StepReview = memo(function StepReview() {
  const { t } = useTranslation();
  const {
    form,
    goToStep,
    isEditMode,
    existingDocuments,
    removedDocumentIds,
    openDocumentPreview,
    canPreviewDocument,
  } = useApplication();
  const {
    setValue,
    watch,
    register,
    formState: { errors },
  } = form;

  const values = watch();
  const documentRows = [
    ...existingDocuments
      .filter((document) => !removedDocumentIds.includes(document.id))
      .map((document) => ({
        key: document.id,
        docType: document.doc_type,
        fileName: document.file_name ?? "",
      })),
    ...values.documents.map((document) => ({
      key: document.documentId,
      docType: document.docType,
      fileName: document.fileName,
    })),
  ];
  // Left blank on a resubmission, the representative on file stays as it is.
  const keepsRepresentative = isEditMode && !values.legalRepFullName.trim();

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display-5 font-semibold !text-button-accent">
        {t("Review & submit")}
      </h2>

      <section className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t("Organization profile")}</h3>
          <button
            type="button"
            className="text-sm text-button-accent underline"
            onClick={() => goToStep("profile")}
          >
            {t("Edit")}
          </button>
        </div>
        <SummaryRow
          label={t("Type of organization")}
          value={t(
            ORG_TYPE_OPTIONS.find((o) => o.value === values.orgType)?.label ??
              "",
          )}
        />
        <SummaryRow label={t("Name")} value={values.name} />
        <SummaryRow label={t("Contact email")} value={values.email} />
        <SummaryRow label={t("Address")} value={values.address} />
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t("Contact & representative")}</h3>
          <button
            type="button"
            className="text-sm text-button-accent underline"
            onClick={() => goToStep("contact")}
          >
            {t("Edit")}
          </button>
        </div>
        {values.channels
          .filter((channel) => channel.url.trim())
          .map((channel) => (
            <SummaryRow
              key={`${channel.type}-${channel.url}`}
              label={t(
                CHANNEL_TYPE_OPTIONS.find((o) => o.value === channel.type)
                  ?.label ?? channel.type,
              )}
              value={channel.url}
            />
          ))}
        <SummaryRow
          label={t("Legal representative")}
          value={
            keepsRepresentative
              ? t("Unchanged from your previous submission")
              : values.legalRepFullName
          }
        />
        {!keepsRepresentative && (
          <SummaryRow label={t("Phone")} value={values.legalRepPhone} />
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t("Legal documents")}</h3>
          <button
            type="button"
            className="text-sm text-button-accent underline"
            onClick={() => goToStep("documents")}
          >
            {t("Edit")}
          </button>
        </div>
        {documentRows.length ? (
          documentRows.map((document) => (
            <SummaryRow
              key={document.key}
              label={t(
                DOC_TYPE_OPTIONS.find((o) => o.value === document.docType)
                  ?.label ?? document.docType,
              )}
              value={
                <DocumentNameLink
                  name={document.fileName}
                  onOpen={
                    canPreviewDocument(document.key)
                      ? () => openDocumentPreview(document.key)
                      : undefined
                  }
                />
              }
            />
          ))
        ) : (
          <p className="text-sm text-foreground-tertiary">
            {t("No documents attached.")}
          </p>
        )}
      </section>

      <div className="flex flex-col gap-2">
        <label className="flex items-start gap-3 text-sm">
          <Checkbox
            checked={values.consent}
            onCheckedChange={(checked) =>
              setValue("consent", checked === true, { shouldValidate: true })
            }
          />
          <span>
            {t(
              "I agree that the information above, including the representative's details, may be processed to assess this application.",
            )}
          </span>
        </label>
        <input
          type="hidden"
          {...register("consent", {
            validate: (value) =>
              value === true || t("You must agree before submitting"),
          })}
        />
        <FieldError errors={[errors.consent]} />
      </div>
    </div>
  );
});

export default StepReview;
