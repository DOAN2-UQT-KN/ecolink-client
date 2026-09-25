import { memo } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/ui/RichTextEditor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/libs/utils";
import {
  DOMAIN_HINT_ORG_TYPES,
  ORG_TYPE_OPTIONS,
} from "../_services/application.service";
import { useApplication } from "../_hooks/useApplication";
import ApplicationAddress from "./ApplicationAddress";
import ApplicationImageField from "./ApplicationImageField";

const inputClassName =
  "border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50";

export const StepProfile = memo(function StepProfile() {
  const { t } = useTranslation();
  const { form } = useApplication();
  const {
    control,
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const orgType = watch("orgType");
  const showsDomainHint = DOMAIN_HINT_ORG_TYPES.includes(
    orgType as (typeof DOMAIN_HINT_ORG_TYPES)[number],
  );

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display-5 font-semibold !text-button-accent">
        {t("Organization profile")}
      </h2>

      <Field>
        <FieldLabel className="text-foreground-tertiary font-display-3">
          {t("Type of organization")}{" "}
          <span className="text-destructive">*</span>
        </FieldLabel>
        {/* Radix Select does not work with `register` — it needs a Controller. */}
        <Controller
          name="orgType"
          control={control}
          rules={{ required: t("Type of organization is required") }}
          render={({ field }) => (
            <Select
              value={field.value || undefined}
              onValueChange={field.onChange}
            >
              <SelectTrigger className={cn("w-full", inputClassName)}>
                <SelectValue placeholder={t("Select a type...")} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {ORG_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className="text-sm">{t(option.label)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {showsDomainHint && (
          <FieldDescription>
            {t(
              "If you use your institution's official email domain, an admin may waive the document step — upload them anyway to get reviewed faster.",
            )}
          </FieldDescription>
        )}
        <FieldError errors={[errors.orgType]} />
      </Field>

      <Field>
        <FieldLabel className="text-foreground-tertiary font-display-3">
          {t("Name")} <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          {...register("name", { required: t("Name is required") })}
          placeholder={t("Enter organization name...")}
          className={inputClassName}
          aria-invalid={!!errors.name}
        />
        <FieldError errors={[errors.name]} />
      </Field>

      <ApplicationAddress />

      <Field>
        <FieldLabel className="text-foreground-tertiary font-display-3">
          {t("Description")}
        </FieldLabel>
        <RichTextEditor
          value={watch("description")}
          onChange={(value) => setValue("description", value)}
          placeholder={t("Enter description...")}
          className={cn(inputClassName, "min-h-[180px]")}
        />
      </Field>

      <div className="grid gap-6 md:grid-cols-2">
        <ApplicationImageField
          control={control}
          name="logo"
          label={t("Logo")}
          error={errors.logo}
          cropAspect={1}
          required
          requiredMessage={t("Logo is required")}
        />
        <ApplicationImageField
          control={control}
          name="background"
          label={t("Background")}
          error={errors.background}
          cropAspect={16 / 9}
        />
      </div>
    </div>
  );
});

export default StepProfile;
