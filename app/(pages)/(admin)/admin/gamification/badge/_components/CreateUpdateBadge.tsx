"use client";

import { memo, useCallback, useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import type { IAdminBadgeDefinition } from "@/apis/gamification/models/gamificationBadge";
import {
  useCreateAdminBadge,
  usePatchAdminBadge,
} from "@/apis/gamification/adminBadge";
import { Button } from "@/components/client/shared/Button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import { cn } from "@/libs/utils";

export interface CreateUpdateBadgeProps {
  open: boolean;
  onClose: () => void;
  badge?: IAdminBadgeDefinition | null;
  onSuccess: () => void;
}

type BadgeFormValues = {
  slug: string;
  name: string;
  symbol: string;
  ruleType: string;
  threshold: string;
  rankTopN: string;
  rankMetric: string;
  rewardJson: string;
  isActive: boolean;
};

const RULE_TYPES = ["CRP", "VRP", "RANK"] as const;

const RANK_METRICS = ["CRP", "VRP", "ORG_AGGREGATE"] as const;

const METRIC_NONE = "__none__";

const INPUT_CLASS =
  "border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50";

function parseOptionalInt(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseRewardJson(raw: string):
  | { ok: true; value: Record<string, unknown> | null }
  | { ok: false } {
  const t = raw.trim();
  if (!t) return { ok: true, value: null };
  try {
    const v = JSON.parse(t) as unknown;
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      return { ok: true, value: v as Record<string, unknown> };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

function defaultValuesFromBadge(
  badge?: IAdminBadgeDefinition | null,
): BadgeFormValues {
  if (!badge) {
    return {
      slug: "",
      name: "",
      symbol: "",
      ruleType: "CRP",
      threshold: "",
      rankTopN: "",
      rankMetric: "",
      rewardJson: "",
      isActive: true,
    };
  }
  return {
    slug: badge.slug,
    name: badge.name,
    symbol: badge.symbol ?? "",
    ruleType: badge.ruleType,
    threshold: badge.threshold != null ? String(badge.threshold) : "",
    rankTopN: badge.rankTopN != null ? String(badge.rankTopN) : "",
    rankMetric: badge.rankMetric ?? "",
    rewardJson:
      badge.reward != null ? JSON.stringify(badge.reward, null, 2) : "",
    isActive: badge.isActive,
  };
}

export const CreateUpdateBadge = memo(function CreateUpdateBadge({
  open,
  onClose,
  badge,
  onSuccess,
}: CreateUpdateBadgeProps) {
  const { t } = useTranslation();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";
  const isCreate = !badge;

  const form = useForm<BadgeFormValues>({
    defaultValues: defaultValuesFromBadge(badge),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (!open) return;
    reset(defaultValuesFromBadge(badge));
  }, [open, badge, reset]);

  const { mutateAsync: createMutate, isPending: isCreating } =
    useCreateAdminBadge({
      onSuccess: () => {
        onSuccess();
        onClose();
      },
    });

  const { mutateAsync: patchMutate, isPending: isPatching } =
    usePatchAdminBadge({
      onSuccess: () => {
        onSuccess();
        onClose();
      },
    });

  const busy = isCreating || isPatching;

  const onValidSubmit = useCallback(
    async (data: BadgeFormValues) => {
      clearErrors("rewardJson");
      const parsed = parseRewardJson(data.rewardJson);
      if (!parsed.ok) {
        setError("rewardJson", {
          message: t("Invalid reward JSON"),
        });
        return;
      }

      const threshold = parseOptionalInt(data.threshold);
      const rankTopN = parseOptionalInt(data.rankTopN);
      if (data.threshold.trim() && threshold === null) {
        setError("threshold", { message: t("Invalid number") });
        return;
      }
      if (data.rankTopN.trim() && rankTopN === null) {
        setError("rankTopN", { message: t("Invalid number") });
        return;
      }

      const rankMetric = data.rankMetric.trim() || null;

      try {
        if (isCreate) {
          await createMutate({
            slug: data.slug.trim(),
            name: data.name.trim(),
            ruleType: data.ruleType,
            isActive: data.isActive,
            symbol: data.symbol.trim() || null,
            threshold,
            rankTopN,
            rankMetric,
            ...(parsed.value !== null ? { reward: parsed.value } : {}),
          });
          return;
        }
        if (!badge) return;
        await patchMutate({
          id: badge.id,
          body: {
            name: data.name.trim(),
            ruleType: data.ruleType,
            symbol: data.symbol.trim() || null,
            threshold,
            rankTopN,
            rankMetric,
            reward: parsed.value,
            isActive: data.isActive,
          },
        });
      } catch {
        /* surfaced by usePost */
      }
    },
    [
      badge,
      clearErrors,
      createMutate,
      isCreate,
      patchMutate,
      setError,
      t,
    ],
  );

  const ruleTypeOptions = useMemo(
    () =>
      RULE_TYPES.map((value) => ({
        value,
        label: value,
      })),
    [],
  );

  const rankMetricOptions = useMemo(
    () =>
      RANK_METRICS.map((value) => ({
        value,
        label: value,
      })),
    [],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className={cn(
          "max-h-[90vh] max-w-lg gap-4 overflow-y-auto sm:max-w-xl",
          isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900",
        )}
        onPointerDownOutside={(e) => {
          if (busy) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle
            className={cn(
              "text-left font-semibold",
              isDark ? "text-zinc-100" : "text-zinc-900",
            )}
          >
            {isCreate ? t("Create badge") : t("Edit badge")}
          </DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col gap-6 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit(onValidSubmit)(e);
          }}
        >
          <div className="flex flex-col gap-6">
            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t("Slug")}{" "}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...register("slug", {
                  required: t("Slug is required"),
                  validate: (v) =>
                    v.trim().length > 0 || t("Slug is required"),
                })}
                placeholder={t("unique-badge-slug")}
                className={cn("h-[48px]", INPUT_CLASS)}
                disabled={busy || !isCreate}
              />
              <FieldError errors={[errors.slug]} />
            </Field>

            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t("Name")}{" "}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                {...register("name", {
                  required: t("Name is required"),
                  validate: (v) =>
                    v.trim().length > 0 || t("Name is required"),
                })}
                placeholder={t("Badge display name")}
                className={cn("h-[48px]", INPUT_CLASS)}
                disabled={busy}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t("Symbol")}
              </FieldLabel>
              <Input
                {...register("symbol")}
                placeholder={t("Emoji or icon key")}
                className={cn("h-[48px]", INPUT_CLASS)}
                disabled={busy}
              />
              <FieldError errors={[errors.symbol]} />
            </Field>

            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t("Rule type")}{" "}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Controller
                control={control}
                name="ruleType"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={busy}
                  >
                    <SelectTrigger className={cn("w-full !h-[48px]", INPUT_CLASS)}>
                      <SelectValue placeholder={t("Rule type")} />
                    </SelectTrigger>
                    <SelectContent>
                      {ruleTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.ruleType]} />
            </Field>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t("Threshold")}
                </FieldLabel>
                <Input
                  type="number"
                  {...register("threshold")}
                  placeholder={t("RP threshold (optional)")}
                  className={cn("h-[48px]", INPUT_CLASS)}
                  disabled={busy}
                />
                <FieldError errors={[errors.threshold]} />
              </Field>

              <Field>
                <FieldLabel className="text-foreground-tertiary font-display-3">
                  {t("Rank top N")}
                </FieldLabel>
                <Input
                  type="number"
                  {...register("rankTopN")}
                  placeholder={t("Top N rank (optional)")}
                  className={cn("h-[48px]", INPUT_CLASS)}
                  disabled={busy}
                />
                <FieldError errors={[errors.rankTopN]} />
              </Field>
            </div>

            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t("Rank metric")}
              </FieldLabel>
              <Controller
                control={control}
                name="rankMetric"
                render={({ field }) => (
                  <Select
                    value={field.value?.trim() ? field.value : METRIC_NONE}
                    onValueChange={(v) =>
                      field.onChange(v === METRIC_NONE ? "" : v)
                    }
                    disabled={busy}
                  >
                    <SelectTrigger className={cn("w-full !h-[48px]", INPUT_CLASS)}>
                      <SelectValue placeholder={t("Rank metric")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={METRIC_NONE}>{t("None")}</SelectItem>
                      {rankMetricOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.rankMetric]} />
            </Field>

            <Field>
              <FieldLabel className="text-foreground-tertiary font-display-3">
                {t("Reward JSON")}
              </FieldLabel>
              <Textarea
                {...register("rewardJson")}
                rows={6}
                placeholder='{"discountBps": 500}'
                className={cn(
                  INPUT_CLASS,
                  "min-h-[140px] font-mono text-sm",
                  isDark && "border-zinc-700 bg-zinc-800 text-zinc-100",
                )}
                disabled={busy}
              />
              <FieldError errors={[errors.rewardJson]} />
            </Field>

            <Field>
              <label className="flex cursor-pointer items-center gap-2 pt-1">
                <Controller
                  control={control}
                  name="isActive"
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(c) => field.onChange(c === true)}
                      disabled={busy}
                    />
                  )}
                />
                <span className="text-foreground-tertiary font-display-3">
                  {t("Active")}
                </span>
              </label>
              <FieldError errors={[errors.isActive]} />
            </Field>
          </div>

          <DialogFooter className="h-[50px] gap-2 space-x-2 pt-2 sm:gap-0">
            <Button
              type="button"
              variant="outlined-brown"
              size="medium"
              onClick={onClose}
              isDisabled={busy}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="submit"
              variant="brown"
              size="medium"
              isLoading={busy}
              isDisabled={busy}
            >
              {t("Confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

export default CreateUpdateBadge;
