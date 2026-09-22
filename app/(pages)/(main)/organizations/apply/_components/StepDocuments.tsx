import { memo, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BiTrash } from "react-icons/bi";
import { IoDocumentAttachOutline } from "react-icons/io5";

import { Button } from "@/components/client/shared/Button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/libs/utils";
import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";
import type { ApplicationDocType } from "@/apis/organization-application/models/application";
import { DOC_TYPE_OPTIONS } from "../_services/application.service";
import { useApplication } from "../_hooks/useApplication";

const MAX_FILES = 5;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"];

const inputClassName =
  "border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50";

/**
 * Uploads go straight to private storage with parameters the server signs, so these files
 * never get a public URL — unlike the logo and banner on the previous step.
 */
export const StepDocuments = memo(function StepDocuments() {
  const { t } = useTranslation();
  const { form, uploadDocument, removeDocument, isUploadingDocument } =
    useApplication();
  const [docType, setDocType] = useState<ApplicationDocType>(
    "ESTABLISHMENT_DECISION",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const documents = form.watch("documents");

  const handlePick = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (!file) return;

      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t("Only PDF, JPG and PNG files are accepted"),
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t("Each file must be at most 10 MB"),
        });
        return;
      }
      if (documents.length >= MAX_FILES) {
        showMessage({
          type: MessageType.Toast,
          level: MessageLevel.Error,
          title: t("You can attach at most 5 documents"),
        });
        return;
      }

      await uploadDocument(file, docType);
    },
    [docType, documents.length, t, uploadDocument],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-display-5 font-semibold !text-button-accent">
          {t("Legal documents")}
        </h2>
        <p className="text-sm text-foreground-tertiary">
          {t(
            "Establishment decision, business licence or a similar document proving the organization exists. Files are stored privately and only reviewers can open them.",
          )}
        </p>
      </div>

      <Field>
        <FieldLabel className="text-foreground-tertiary font-display-3">
          {t("Document type")}
        </FieldLabel>
        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Local state, not a form field — so a plain Select, no Controller. */}
          <Select
            value={docType}
            onValueChange={(value) => setDocType(value as ApplicationDocType)}
          >
            <SelectTrigger className={cn("w-full sm:w-[260px]", inputClassName)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="text-sm">{t(option.label)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outlined-brown"
            onClick={() => inputRef.current?.click()}
            isDisabled={isUploadingDocument || documents.length >= MAX_FILES}
            className="sm:w-auto"
          >
            {isUploadingDocument ? t("Uploading...") : t("Choose a file")}
          </Button>
        </div>
        <FieldDescription>
          {t("PDF, JPG or PNG. Up to 5 files, 10 MB each.")}
        </FieldDescription>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_MIME_TYPES.join(",")}
          className="hidden"
          onChange={handlePick}
        />
      </Field>

      {documents.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {documents.map((document) => (
            <li
              key={document.documentId}
              className="flex items-center gap-3 rounded-md border border-[rgba(136,122,71,0.35)] px-3 py-2"
            >
              <IoDocumentAttachOutline className="shrink-0 text-button-accent" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{document.fileName}</p>
                <p className="text-xs text-foreground-tertiary">
                  {t(
                    DOC_TYPE_OPTIONS.find((o) => o.value === document.docType)
                      ?.label ?? document.docType,
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeDocument(document.documentId)}
                aria-label={t("Remove")}
                className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              >
                <BiTrash />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-md bg-[rgba(136,122,71,0.08)] px-3 py-2 text-sm text-foreground-tertiary">
          {t(
            "You can submit without documents, but a reviewer will most likely ask for them before approving.",
          )}
        </p>
      )}
    </div>
  );
});

export default StepDocuments;
