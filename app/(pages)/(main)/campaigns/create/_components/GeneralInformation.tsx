"use client";

import { memo, useMemo } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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

  const difficultyMin = difficultyOptions[0] ?? 1;
  const difficultyMax = difficultyOptions[difficultyOptions.length - 1] ?? 5;

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
            rows={4}
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
              <div className="flex flex-col gap-3 rounded-lg border border-[rgba(136,122,71,0.5)] bg-white/5 px-4 py-3">
                <div className="flex items-center justify-between text-sm text-foreground-tertiary">
                  <span>{t("Level")}</span>
                  <span className="font-medium text-foreground">
                    {field.value ?? difficultyMin}
                  </span>
                </div>
                <Slider
                  min={difficultyMin}
                  max={difficultyMax}
                  step={1}
                  value={[field.value ?? difficultyMin]}
                  onValueChange={(value) => field.onChange(value[0] ?? difficultyMin)}
                  aria-label={t("Difficulty")}
                  className="[&_[data-slot=slider-range]]:bg-button-accent [&_[data-slot=slider-thumb]]:border-button-accent"
                />
              </div>
            )}
          />
          <FieldError errors={[errors.difficulty]} />
        </Field>
      </div>
    </div>
  );
});

export default GeneralInformation;
