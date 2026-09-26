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
import { SummaryList, SummaryRow, groupBy } from "./ApplicationDetails";
import FileTypeIcon from "@/components/ui/FileTypeIcon";
import { DocumentNameLink } from "./DocumentNameLink";

export const StepReview = memo(function StepReview() {
  const { t } = useTranslation();
  const {
    form,
    goToStep,
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
        mimeType: document.mime_type,
      })),
    ...values.documents.map((document) => ({
      key: document.documentId,
      docType: document.docType,
      fileName: document.fileName,
      mimeType: document.mimeType,
    })),
  ];
  const legalRep = values.owners.find((owner) => owner.isLegalRep);
  const otherOwners = values.owners.filter((owner) => !owner.isLegalRep);
  const ownerLabel = (owner: { fullName: string; email: string }) =>
    `${owner.fullName} <${owner.email}>`;

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
        <SummaryRow label={t("Address")} value={values.address} />
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t("Contact")}</h3>
          <button
            type="button"
            className="text-sm text-button-accent underline"
            onClick={() => goToStep("contact")}
          >
            {t("Edit")}
          </button>
        </div>
        <SummaryRow label={t("Contact email")} value={values.contactEmail} />
        {groupBy(
          values.channels.filter((channel) => channel.url.trim()),
          (channel) => channel.type,
        ).map(([type, group]) => (
          <SummaryRow
            key={type}
            label={t(
              CHANNEL_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type,
            )}
            value={
              <SummaryList
                items={group.map((channel) => ({
                  key: channel.url,
                  node: channel.url,
                }))}
              />
            }
          />
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{t("Owners")}</h3>
          <button
            type="button"
            className="text-sm text-button-accent underline"
            onClick={() => goToStep("owners")}
          >
            {t("Edit")}
          </button>
        </div>
        <SummaryRow
          label={t("Legal representative")}
          value={legalRep ? ownerLabel(legalRep) : ""}
        />
        {otherOwners.length > 0 && (
          <SummaryRow
            label={otherOwners.length > 1 ? t("Owners") : t("Owner")}
            value={
              <SummaryList
                items={otherOwners.map((owner) => ({
                  key: owner.email,
                  node: ownerLabel(owner),
                }))}
              />
            }
          />
        )}
        <SummaryRow label={t("Phone")} value={legalRep ? values.legalRepPhone : ""} />
        <p className="text-sm text-foreground-tertiary">
          {t(
            "After you submit, every other owner receives an email and must confirm. Changing the name, type, legal representative or owner list later asks everyone to confirm again.",
          )}
        </p>
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
          groupBy(documentRows, (document) => document.docType).map(([docType, group]) => (
            <SummaryRow
              key={docType}
              label={t(
                DOC_TYPE_OPTIONS.find((o) => o.value === docType)?.label ?? docType,
              )}
              value={
                <SummaryList
                  items={group.map((document) => ({
                    key: document.key,
                    node: (
                      <span className="inline-flex max-w-full items-center gap-1.5 align-middle">
                        <FileTypeIcon
                          mimeType={document.mimeType}
                          fileName={document.fileName}
                          className="size-4"
                        />
                        <DocumentNameLink
                          name={document.fileName}
                          onOpen={
                            canPreviewDocument(document.key)
                              ? () => openDocumentPreview(document.key)
                              : undefined
                          }
                        />
                      </span>
                    ),
                  }))}
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
