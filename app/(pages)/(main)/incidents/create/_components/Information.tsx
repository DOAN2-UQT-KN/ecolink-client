"use client";

import { useTranslation } from "react-i18next";
import { useIncidentContext } from "./IncidentContext";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { MultiSelect } from "@/components/ui/select";
import { Controller } from "react-hook-form";
import { cn } from "@/libs/utils";

const wasteTypeOptions = [
  { label: "Household waste", value: "household" },
  { label: "Construction waste", value: "construction" },
  { label: "Industrial waste", value: "industrial" },
  { label: "Hazardous waste", value: "hazardous" },
];

const conditionOptions = [
  { label: "Newly-appeared", value: "newly-appeared" },
  { label: "Long-standing", value: "long-standing" },
  { label: "Previously cleaned but reappeared", value: "reappeared" },
];

const pollutionLevelOptions = [
  { label: "Odor present / No odor", value: "odor" },
  { label: "Leachate present / No leachate", value: "leachate" },
  { label: "Smoke or fire present / No smoke or fire", value: "smoke-fire" },
];

const sizeOptions = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

export default function Information() {
  const { t } = useTranslation();
  const { form, onSubmit, isPending } = useIncidentContext();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = form;

  const renderGeneralInformation = () => (
    <div className="flex flex-col gap-6">
      <span className="font-semibold text-xl border-b border-white/10 pb-2">
        {t("General Information")}
      </span>

      <Field>
        <FieldLabel className="text-foreground-secondary font-medium">
          {t("Title")} <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          {...register("title", { required: t("Title is required") })}
          placeholder={t("Enter title...")}
          className="border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50"
        />
        <FieldError errors={[errors.title]} />
      </Field>

      <Field>
        <FieldLabel className="text-foreground-secondary font-medium">
          {t("Description")}
        </FieldLabel>
        <Input
          {...register("description")}
          placeholder={t("Enter description...")}
          className="border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50"
        />
        <FieldError errors={[errors.description]} />
      </Field>
    </div>
  );

  const renderDetailInformation = () => (
    <div className="flex flex-col gap-6">
      <span className="font-semibold text-xl border-b border-white/10 pb-2">
        {t("Detail Information")}
      </span>

      {/* Waste Type — multi-select */}
      <Field>
        <FieldLabel className="text-foreground-secondary font-medium mb-1">
          {t("Waste type")}
        </FieldLabel>
        <Controller
          name="wasteTypes"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <MultiSelect
              options={wasteTypeOptions.map((o) => ({
                ...o,
                label: t(o.label),
              }))}
              value={field.value ?? []}
              onChange={field.onChange}
              placeholder={t("Select waste type...")}
              triggerClassName="border-[rgba(136,122,71,0.5)] focus-visible:ring-[rgba(136,122,71,0.5)]/50 w-full"
            />
          )}
        />
      </Field>

      {/* Condition — single-select radio */}
      <Field>
        <FieldLabel className="text-foreground-secondary font-medium mb-1">
          {t("Condition")}
        </FieldLabel>
        <Controller
          name="condition"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex flex-col gap-1"
            >
              {conditionOptions.map((option) => (
                <label
                  key={option.value}
                  htmlFor={`condition-${option.value}`}
                  className={cn(
                    "flex items-center gap-2 py-2.5 px-3 rounded-lg border transition-all cursor-pointer",
                    field.value === option.value
                      ? "bg-button-accent/10 border-button-accent"
                      : "bg-white/5 border-white/10 hover:border-white/20",
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`condition-${option.value}`}
                  />
                  <span className="text-sm font-normal flex-1">
                    {t(option.label)}
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </Field>

      {/* Pollution Level — multi-select */}
      <Field>
        <FieldLabel className="text-foreground-secondary font-medium mb-1">
          {t("Pollution level")}
        </FieldLabel>
        <Controller
          name="pollutionLevels"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <MultiSelect
              options={pollutionLevelOptions.map((o) => ({
                ...o,
                label: t(o.label),
              }))}
              value={field.value ?? []}
              onChange={field.onChange}
              placeholder={t("Select pollution level...")}
              triggerClassName="border-[rgba(136,122,71,0.5)] focus-visible:ring-[rgba(136,122,71,0.5)]/50 w-full"
            />
          )}
        />
      </Field>

      {/* Size — single-select radio */}
      <Field>
        <FieldLabel className="text-foreground-secondary font-medium mb-1">
          {t("Size")}
        </FieldLabel>
        <Controller
          name="size"
          control={control}
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={field.onChange}
              className="flex flex-row gap-4"
            >
              {sizeOptions.map((option) => (
                <label
                  key={option.value}
                  htmlFor={`size-${option.value}`}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer flex-1 justify-center",
                    field.value === option.value
                      ? "bg-button-accent/10 border-button-accent"
                      : "bg-white/5 border-white/10 hover:border-white/20",
                  )}
                >
                  <RadioGroupItem
                    value={option.value}
                    id={`size-${option.value}`}
                  />
                  <span className="text-sm font-semibold">
                    {t(option.label)}
                  </span>
                </label>
              ))}
            </RadioGroup>
          )}
        />
      </Field>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col gap-[30px] px-[30px] py-[35px] border-1 border-[rgba(136,122,71,0.5)] rounded-[20px] bg-white/50 shadow-lg ring-1 ring-white/5 overflow-y-auto scrollbar-hide">
      <span className="font-bold text-button-accent font-display-8 uppercase tracking-wider">
        {t("New Report")}
      </span>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
        {renderGeneralInformation()}
        {renderDetailInformation()}

        <button
          type="submit"
          disabled={isPending}
          className="mt-4 h-[55px] w-full rounded-xl bg-button-accent text-white font-bold text-lg hover:bg-button-accent/90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {isPending ? t("Submitting...") : t("Create Report")}
        </button>
      </form>
    </div>
  );
}
