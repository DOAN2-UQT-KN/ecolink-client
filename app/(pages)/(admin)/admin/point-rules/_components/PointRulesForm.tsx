import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { TbEdit } from "react-icons/tb";

import { useGetPointRules } from "@/apis/gamification/getPointRules";
import { useUpdatePointRules } from "@/apis/gamification/updatePointRules";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  POINT_RULE_FIELDS,
  toFormValues,
  toRequest,
  validateExpirationDays,
  validateMilestones,
  validatePoints,
  type PointRulesFormValues,
} from "../_services/pointRulesForm.service";

const LABELS: Record<(typeof POINT_RULE_FIELDS)[number], { label: string; hint: string }> = {
  campaignCompletionPoints: {
    label: "Campaign points",
    hint: "Full participation in a completed campaign; scaled by eligible shifts out of registered shifts.",
  },
  baseReportPoint: {
    label: "Report base points",
    hint: "The n-th upvote milestone a report reaches pays base × n.",
  },
  reportMilestoneThresholds: {
    label: "Upvote milestones",
    hint: "Upvote counts, separated by commas, e.g. 1, 2, 5, 10.",
  },
  reportCompletionPoints: {
    label: "Report completion points",
    hint: "Paid to the reporter when an admin marks the report done.",
  },
  pointExpirationDays: {
    label: "Point expiry (days)",
    hint: "Points from each award expire after this many days. Applies to points credited after you save.",
  },
};

const VALIDATORS: Record<(typeof POINT_RULE_FIELDS)[number], (value: string) => true | string> = {
  campaignCompletionPoints: validatePoints,
  baseReportPoint: validatePoints,
  reportMilestoneThresholds: validateMilestones,
  reportCompletionPoints: validatePoints,
  pointExpirationDays: validateExpirationDays,
};

export function PointRulesForm() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useGetPointRules();
  const { mutateAsync, isPending } = useUpdatePointRules();
  const rules = data?.data?.rules;
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<PointRulesFormValues>();

  useEffect(() => {
    if (rules) reset(toFormValues(rules));
  }, [rules, reset]);

  const onSubmit = async (values: PointRulesFormValues) => {
    try {
      const res = await mutateAsync(toRequest(values));
      reset(toFormValues(res.data.rules));
      setEditing(false);
    } catch (error) {
      // usePost shows the toast; also mark the fields the server rejected.
      const fieldErrors = (error as { errors?: { field?: string; message: string }[] }).errors ?? [];
      for (const e of fieldErrors) {
        const field = POINT_RULE_FIELDS.find((f) => f === e.field);
        if (field) setError(field, { message: e.message });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-[10px] border border-border bg-card p-4">
        {POINT_RULE_FIELDS.map((f) => (
          <Skeleton key={f} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (isError || !rules) {
    return (
      <div className="space-y-3 rounded-[10px] border border-border bg-card p-4" role="alert">
        <p className="text-sm text-foreground">{t("Could not load the point rules.")}</p>
        <Button type="button" variant="outline" onClick={() => refetch()}>
          {t("Try again")}
        </Button>
      </div>
    );
  }

  // Edit and Cancel both start from the saved values (Cancel drops changes and errors).
  const startEditing = () => {
    reset(toFormValues(rules));
    setEditing(true);
  };
  const cancelEditing = () => {
    reset(toFormValues(rules));
    setEditing(false);
  };

  if (!editing) {
    const shown = toFormValues(rules);
    return (
      <div className="space-y-4 rounded-[10px] border border-border bg-card p-4">
        <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {POINT_RULE_FIELDS.map((field) => (
            <div key={field} className="flex flex-col gap-1">
              <dt className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                {t(LABELS[field].label)}
                <InfoTooltip content={t(LABELS[field].hint)} />
              </dt>
              <dd className="text-base font-normal text-foreground tabular-nums">{shown[field] || "—"}</dd>
            </div>
          ))}
        </dl>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={startEditing} className="px-4 cursor-pointer">
            <TbEdit className="size-4" />
            {t("Edit")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-[10px] border border-border bg-card p-4"
      noValidate
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {POINT_RULE_FIELDS.map((field) => (
          <Field key={field}>
            <FieldLabel htmlFor={`point-rule-${field}`}>
              {t(LABELS[field].label)} <span className="text-destructive">*</span>
              <InfoTooltip content={t(LABELS[field].hint)} />
            </FieldLabel>
            <Input
              id={`point-rule-${field}`}
              inputMode={field === "reportMilestoneThresholds" ? "text" : "numeric"}
              aria-invalid={!!errors[field]}
              {...register(field, {
                validate: (v) => {
                  const r = VALIDATORS[field](v);
                  return r === true ? true : t(r);
                },
              })}
            />
            {errors[field] && <span className="text-red-500 text-sm mt-1">{errors[field]?.message}</span>}
          </Field>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={cancelEditing}
          disabled={isPending}
          className="px-4 cursor-pointer"
        >
          {t("Cancel")}
        </Button>
        <Button type="submit" disabled={isPending} className="px-4 cursor-pointer">
          {isPending && <Loader2 className="size-4 animate-spin" />}
          {t("Save")}
        </Button>
      </div>
    </form>
  );
}
