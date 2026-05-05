"use client";

import { memo, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { useTranslation } from "react-i18next";

import type { ISeason } from "@/apis/gamification/season/models";
import {
  useCreateAdminSeason,
  usePatchAdminSeason,
} from "@/apis/gamification/season/list";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
  parseIsoToDate,
  toIsoEndOfDay,
  toIsoStartOfDay,
} from "../_services/seasonAdmin.service";

type SeasonFormValues = {
  label: string;
  kind: "MONTHLY" | "QUARTERLY";
  startsAt?: Date;
  endsAt?: Date;
};

function defaultValuesFromSeason(season?: ISeason | null): SeasonFormValues {
  return {
    label: season?.label ?? "",
    kind: (season?.kind as "MONTHLY" | "QUARTERLY") ?? "MONTHLY",
    startsAt: parseIsoToDate(season?.startsAt),
    endsAt: parseIsoToDate(season?.endsAt),
  };
}

export const CreateUpdateSeason = memo(function CreateUpdateSeason({
  open,
  onClose,
  season,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  season?: ISeason | null;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const isCreate = !season;

  const form = useForm<SeasonFormValues>({
    defaultValues: defaultValuesFromSeason(season),
  });
  const {
    control,
    register,
    reset,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    watch,
    formState: { errors },
  } = form;

  const startsAt = watch("startsAt");
  const endsAt = watch("endsAt");

  useEffect(() => {
    if (!open) return;
    reset(defaultValuesFromSeason(season));
  }, [open, reset, season]);

  const { mutateAsync: createMutate, isPending: isCreating } = useCreateAdminSeason({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });
  const { mutateAsync: patchMutate, isPending: isPatching } = usePatchAdminSeason({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const busy = isCreating || isPatching || form.formState.isSubmitting;
  const dateLabel = useMemo(() => {
    if (!startsAt || !endsAt) return t("Pick a date range");
    return `${format(startsAt, "PPP")} - ${format(endsAt, "PPP")}`;
  }, [endsAt, startsAt, t]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) onClose();
      }}
    >
      <DialogContent
        showCloseButton
        className="max-h-[90vh] max-w-lg gap-4 overflow-y-auto sm:max-w-xl"
      >
        <DialogHeader>
          <DialogTitle>{isCreate ? t("Create season") : t("Edit season")}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit(async (values) => {
              clearErrors(["startsAt", "endsAt"]);
              if (!values.startsAt || !values.endsAt) {
                setError("startsAt", { message: t("Date range is required") });
                return;
              }
              if (values.startsAt >= values.endsAt) {
                setError("endsAt", { message: t("End date must be after start date") });
                return;
              }

              const startsAtIso = toIsoStartOfDay(values.startsAt);
              const endsAtIso = toIsoEndOfDay(values.endsAt);
              if (!startsAtIso || !endsAtIso) {
                setError("startsAt", { message: t("Invalid dates") });
                return;
              }

              try {
                if (isCreate) {
                  await createMutate({
                    label: values.label.trim() || null,
                    kind: values.kind,
                    startsAt: startsAtIso,
                    endsAt: endsAtIso,
                    status: "ACTIVE",
                  });
                } else if (season) {
                  await patchMutate({
                    id: season.id,
                    body: {
                      label: values.label.trim() || null,
                      kind: values.kind,
                      startsAt: startsAtIso,
                      endsAt: endsAtIso,
                    },
                  });
                }
              } catch {
                /* surfaced by usePost */
              }
            })(e);
          }}
        >
          <Field>
            <FieldLabel>{t("Label")}</FieldLabel>
            <Input
              {...register("label")}
              placeholder={t("Season label")}
              className="h-10 border border-zinc-300"
              disabled={busy}
            />
            <FieldError errors={[errors.label]} />
          </Field>

          <Field>
            <FieldLabel>
              {t("Kind")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Controller
              control={control}
              name="kind"
              rules={{ required: true }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={busy}>
                  <SelectTrigger className="h-10 border border-zinc-300">
                    <SelectValue placeholder={t("Select kind")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">{t("Monthly")}</SelectItem>
                    <SelectItem value="QUARTERLY">{t("Quarterly")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError errors={[errors.kind]} />
          </Field>

          <Field>
            <FieldLabel>{t("Season schedule")}</FieldLabel>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-10 w-full justify-start text-left font-normal border-zinc-300 hover:bg-transparent",
                  !startsAt && "text-muted-foreground",
                )}
                onClick={() => setIsDateRangeOpen((prev) => !prev)}
                disabled={busy}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateLabel}
              </Button>
              {isDateRangeOpen && (
                <div className="absolute z-50 mt-2 rounded-md border border-zinc-300 bg-background shadow-md">
                  <Calendar
                    mode="range"
                    numberOfMonths={2}
                    defaultMonth={startsAt ?? new Date()}
                    selected={{ from: startsAt, to: endsAt }}
                    onSelect={(range: DateRange | undefined) => {
                      setValue("startsAt", range?.from, { shouldDirty: true });
                      setValue("endsAt", range?.to, { shouldDirty: true });
                    }}
                  />
                </div>
              )}
            </div>
            <FieldError errors={[errors.startsAt]} />
            <FieldError errors={[errors.endsAt]} />
          </Field>

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onClose()}
              disabled={busy}
              className="h-[45px] cursor-pointer px-4"
            >
              {t("Cancel")}
            </Button>
            <Button type="submit" disabled={busy} className="h-[45px] cursor-pointer px-4">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});
