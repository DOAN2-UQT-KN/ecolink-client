import { memo } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BiTrash } from "react-icons/bi";

import type { OwnerCandidateStatus } from "@/apis/organization-application/models/application";
import { Button } from "@/components/client/shared/Button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TagStatus from "@/components/ui/TagStatus";
import { OWNER_CANDIDATE_STATUS_TAG } from "@/constants/organizationApplicationStatus";
import { cn } from "@/libs/utils";
import {
  LEGAL_REP_ID_TYPE_OPTIONS,
  MAX_OWNERS,
  validateOwnerList,
} from "../_services/application.service";
import { useApplication } from "../_hooks/useApplication";

const inputClassName =
  "border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Who will own the organization. Each person gets their own email and must confirm before the
 * application reaches a reviewer — nobody is given a role without agreeing to it. The
 * submitter is always on the list (their mailbox already passed the code).
 */
export const StepOwners = memo(function StepOwners() {
  const { t } = useTranslation();
  const { form, submitterEmail, application } = useApplication();
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "owners",
    rules: {
      validate: (owners) => {
        const result = validateOwnerList(owners, submitterEmail);
        return result === true ? true : t(result);
      },
    },
  });

  const owners = watch("owners");
  const savedStatusByEmail = new Map<string, OwnerCandidateStatus>(
    (application?.owners ?? []).map((owner) => [owner.email, owner.status]),
  );
  const savedIdLast4 = application?.legal_representative.id_last4 ?? null;
  const legalRepIndex = owners.findIndex((owner) => owner.isLegalRep);

  const markLegalRep = (index: number) => {
    owners.forEach((_, i) =>
      setValue(`owners.${i}.isLegalRep`, i === index, { shouldDirty: true }),
    );
    void form.trigger("owners");
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display-5 font-semibold !text-button-accent">
            {t("Owners")}
          </h2>
          <p className="text-sm text-foreground-tertiary">
            {t(
              "The people who will manage the organization, up to 5. Each of them receives an email and must confirm within 14 days; the application is only reviewed once everyone has confirmed.",
            )}
          </p>
        </div>

        {fields.map((field, index) => {
          const email = owners[index]?.email?.trim().toLowerCase() ?? "";
          const isSubmitter = email === submitterEmail;
          const savedStatus = savedStatusByEmail.get(email);
          const rowErrors = errors.owners?.[index];

          return (
            <div
              key={field.id}
              className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {t("Owner {{number}}", { number: index + 1 })}
                  {isSubmitter && (
                    <span className="rounded-full bg-[rgba(136,122,71,0.12)] px-2 py-0.5 text-xs font-normal text-button-accent">
                      {t("You")}
                    </span>
                  )}
                  {savedStatus && application?.status === "NEEDS_REVISION" && (
                    <TagStatus
                      type={OWNER_CANDIDATE_STATUS_TAG[savedStatus].type}
                      label={t(OWNER_CANDIDATE_STATUS_TAG[savedStatus].label)}
                      className="!m-0"
                    />
                  )}
                </div>
                {!isSubmitter && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={t("Remove")}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-500 transition-colors hover:bg-red-200 cursor-pointer"
                  >
                    <BiTrash size={18} />
                  </button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field>
                  <FieldLabel className="text-foreground-tertiary font-display-3">
                    {t("Email")} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    type="email"
                    readOnly={isSubmitter}
                    {...register(`owners.${index}.email` as const, {
                      required: t("Email is required"),
                      pattern: {
                        value: EMAIL_PATTERN,
                        message: t("Invalid email address"),
                      },
                    })}
                    className={cn(inputClassName, isSubmitter && "bg-muted")}
                  />
                  <FieldError errors={[rowErrors?.email]} />
                </Field>

                <Field>
                  <FieldLabel className="text-foreground-tertiary font-display-3">
                    {t("Full name")} <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...register(`owners.${index}.fullName` as const, {
                      required: t("Full name is required"),
                      maxLength: { value: 200, message: t("Too long") },
                    })}
                    className={inputClassName}
                  />
                  <FieldError errors={[rowErrors?.fullName]} />
                </Field>
              </div>

              <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="legal-representative"
                  checked={Boolean(owners[index]?.isLegalRep)}
                  onChange={() => markLegalRep(index)}
                  className="size-4 accent-[var(--color-button-accent,#887a47)]"
                />
                {t("Legal representative")}
              </label>
            </div>
          );
        })}

        <FieldError errors={[errors.owners?.root]} />

        {fields.length < MAX_OWNERS && (
          <div>
            <Button
              variant="outlined-brown"
              size="medium"
              onClick={() =>
                append({ email: "", fullName: "", isLegalRep: false })
              }
            >
              {t("Add owner")}
            </Button>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display-5 font-semibold !text-button-accent">
            {t("Legal representative details")}
          </h2>
          <p className="text-sm text-foreground-tertiary">
            {legalRepIndex >= 0 && owners[legalRepIndex]?.fullName
              ? t("For {{name}}.", { name: owners[legalRepIndex].fullName })
              : t("Choose the legal representative in the list above.")}{" "}
            {t(
              "Used only to assess this application. It is never shown on your organization page, and we store the ID number as a one-way hash plus its last 4 characters.",
            )}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Position")}
            </FieldLabel>
            <Input
              {...register("legalRepPosition")}
              placeholder={t("e.g. Club president")}
              className={inputClassName}
            />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Phone")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              {...register("legalRepPhone", {
                required: t("Phone is required"),
              })}
              className={inputClassName}
            />
            <FieldError errors={[errors.legalRepPhone]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("ID type")}
            </FieldLabel>
            <Controller
              name="legalRepIdType"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className={cn("w-full", inputClassName)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEGAL_REP_ID_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="text-sm">{t(option.label)}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("ID number")}{" "}
              {!savedIdLast4 && <span className="text-destructive">*</span>}
            </FieldLabel>
            <Input
              {...register("legalRepIdNumber", {
                validate: (value) =>
                  Boolean(value.trim()) ||
                  Boolean(savedIdLast4) ||
                  t("ID number is required"),
                minLength: { value: 4, message: t("ID number is too short") },
              })}
              placeholder={savedIdLast4 ? `•••• ${savedIdLast4}` : ""}
              className={inputClassName}
            />
            <FieldDescription>
              {savedIdLast4
                ? t("Saved. Leave blank to keep it.")
                : t("We never store the full number.")}
            </FieldDescription>
            <FieldError errors={[errors.legalRepIdNumber]} />
          </Field>
        </div>
      </section>
    </div>
  );
});

export default StepOwners;
