"use client";

import { memo, useMemo } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/libs/utils";
import SelectListOrganization from "@/components/form/SelectListOrganization";

import { useCampaign } from "../_hooks/useCampaign";
import { difficultyOptions } from "../_services/campaign.service";

const GeneralInformation = memo(function GeneralInformation({
  organizationId,
}: {
  organizationId?: string;
}) {
  const { t } = useTranslation();
  const { form } = useCampaign();
  const {
    register,
    control,
    formState: { errors },
  } = form;

  const inputClassName = useMemo(
    () =>
      "border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50",
    [],
  );

  const translatedDifficultyOptions = useMemo(
    () =>
      difficultyOptions.map((value) => ({
        value: String(value),
        label: `${t("Level")} ${value}`,
      })),
    [t],
  );

  return (
    <div className="w-full h-full flex flex-col gap-[30px] px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[10px] bg-white/80 shadow-sm ring-1 ring-white/5 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col gap-6">
        <span className="font-display-5 font-semibold !text-button-accent ">
          {t("General Information")}
        </span>

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Organization")} <span className="text-destructive">*</span>
          </FieldLabel>
          <Controller
            name="organization_id"
            control={control}
            rules={{ required: t("Organization is required") }}
            render={({ field }) => (
              <SelectListOrganization
                value={field.value}
                onChange={field.onChange}
                disabled={Boolean(organizationId)}
              />
            )}
          />
          <FieldError errors={[errors.organization_id]} />
        </Field>

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Title")} <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            {...register("title", { required: t("Title is required") })}
            placeholder={t("Enter campaign title...")}
            className={inputClassName}
          />
          <FieldError errors={[errors.title]} />
        </Field>

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Description")}
          </FieldLabel>
          <Textarea
            {...register("description")}
            placeholder={t("Describe this campaign...")}
            className={cn(inputClassName, "min-h-[120px]")}
          />
          <FieldError errors={[errors.description]} />
        </Field>

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Difficulty")}
          </FieldLabel>
          <Controller
            name="difficulty"
            control={control}
            render={({ field }) => (
              <RadioGroup
                value={String(field.value)}
                onValueChange={(value) => field.onChange(Number(value))}
                className="flex flex-col gap-1"
              >
                {translatedDifficultyOptions.map((option) => (
                  <label
                    key={option.value}
                    htmlFor={`difficulty-${option.value}`}
                    className={cn(
                      "flex items-center gap-2 py-2.5 px-3 rounded-lg border transition-all cursor-pointer",
                      String(field.value) === option.value
                        ? "bg-button-accent/10 border-button-accent"
                        : "bg-white/5 border-white/10 hover:border-white/20",
                    )}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={`difficulty-${option.value}`}
                    />
                    <span className="text-sm font-normal flex-1">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            )}
          />
          <FieldError errors={[errors.difficulty]} />
        </Field>
      </div>
    </div>
  );
});

export default GeneralInformation;
