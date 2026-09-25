import { memo } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BiTrash } from "react-icons/bi";

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
import { cn } from "@/libs/utils";
import {
  ApplicationFormValues,
  CHANNEL_TYPE_OPTIONS,
  LEGAL_REP_ID_TYPE_OPTIONS,
} from "../_services/application.service";
import { useApplication } from "../_hooks/useApplication";

const inputClassName =
  "border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50";

/** Any of the three identifying fields filled means the applicant is replacing the representative. */
const hasRepresentative = (values: ApplicationFormValues) =>
  Boolean(
    values.legalRepFullName.trim() ||
      values.legalRepIdNumber.trim() ||
      values.legalRepPhone.trim(),
  );

export const StepContact = memo(function StepContact() {
  const { t } = useTranslation();
  const { form, isEditMode } = useApplication();

  // On a resubmission the representative is optional: the server keeps the one already on
  // file unless a complete new one is sent. A new application always needs one.
  const requiredRep = (message: string) =>
    isEditMode
      ? {
          validate: (value: string, values: ApplicationFormValues) =>
            Boolean(value.trim()) || !hasRepresentative(values) || message,
        }
      : { required: message };
  const requiredMark = isEditMode ? null : (
    <span className="text-destructive">*</span>
  );
  const {
    control,
    register,
    formState: { errors },
  } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "channels",
  });

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display-5 font-semibold !text-button-accent">
            {t("Official channels")}
          </h2>
          <p className="text-sm text-foreground-tertiary">
            {t(
              "Shown publicly on your organization page so people can reach you. At least one is required.",
            )}
          </p>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col gap-2 sm:flex-row">
            <Controller
              name={`channels.${index}.type` as const}
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    className={cn("w-full sm:w-[180px]", inputClassName)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CHANNEL_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="text-sm">{t(option.label)}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Input
              {...register(`channels.${index}.url` as const, {
                required:
                  index === 0 ? t("At least one channel is required") : false,
                pattern: {
                  value: /^https?:\/\/.+/i,
                  message: t("The link must start with http:// or https://"),
                },
              })}
              placeholder="https://facebook.com/..."
              className={inputClassName}
            />
            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={t("Remove")}
                className="flex h-[50px] w-[50px] shrink-0 items-center justify-center self-start rounded-full bg-red-100 text-red-500 shadow-sm transition-colors hover:bg-red-200 cursor-pointer"
              >
                <BiTrash size={22} />
              </button>
            )}
          </div>
        ))}
        <FieldError errors={[errors.channels?.[0]?.url]} />

        <div>
          <Button
            variant="outlined-brown"
            size="medium"
            onClick={() => append({ type: "WEBSITE", url: "" })}
          >
            {t("Add another channel")}
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-display-5 font-semibold !text-button-accent">
            {t("Legal representative")}
          </h2>
          <p className="text-sm text-foreground-tertiary">
            {t(
              "Used only to assess this application. It is never shown on your organization page, and we store the ID number as a one-way hash plus its last 4 characters.",
            )}
          </p>
          {isEditMode && (
            <p className="rounded-md bg-[rgba(136,122,71,0.08)] px-3 py-2 text-sm text-foreground-secondary">
              {t("Leave blank to keep the representative you submitted before.")}
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Full name")} {requiredMark}
            </FieldLabel>
            <Input
              {...register(
                "legalRepFullName",
                requiredRep(t("Full name is required")),
              )}
              className={inputClassName}
            />
            <FieldError errors={[errors.legalRepFullName]} />
          </Field>

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
              {t("ID number")} {requiredMark}
            </FieldLabel>
            <Input
              {...register("legalRepIdNumber", {
                ...requiredRep(t("ID number is required")),
                minLength: { value: 4, message: t("ID number is too short") },
              })}
              className={inputClassName}
            />
            <FieldDescription>
              {t("We never store the full number.")}
            </FieldDescription>
            <FieldError errors={[errors.legalRepIdNumber]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Phone")} {requiredMark}
            </FieldLabel>
            <Input
              {...register("legalRepPhone", requiredRep(t("Phone is required")))}
              className={inputClassName}
            />
            <FieldError errors={[errors.legalRepPhone]} />
          </Field>

          <Field>
            <FieldLabel className="text-foreground-tertiary font-display-3">
              {t("Personal email")}
            </FieldLabel>
            <Input
              type="email"
              {...register("legalRepEmail", {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t("Invalid email address"),
                },
              })}
              className={inputClassName}
            />
            <FieldDescription>
              {t("Copied on the approval email. Optional.")}
            </FieldDescription>
            <FieldError errors={[errors.legalRepEmail]} />
          </Field>
        </div>
      </section>
    </div>
  );
});

export default StepContact;
