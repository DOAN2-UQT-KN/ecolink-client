import { memo } from "react";
import { Controller, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { BiTrash } from "react-icons/bi";

import { Button } from "@/components/client/shared/Button";
import { Field, FieldDescription, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/libs/utils";
import { CHANNEL_TYPE_OPTIONS } from "../_services/application.service";
import { useApplication } from "../_hooks/useApplication";

const inputClassName =
  "border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50";

export const StepContact = memo(function StepContact() {
  const { t } = useTranslation();
  const { form, submitterEmail } = useApplication();
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
            {t("Contact email")}
          </h2>
          <p className="text-sm text-foreground-tertiary">
            {t(
              "The organization's public contact address. It is only used to contact the organization — it never becomes a login.",
            )}
          </p>
        </div>
        <Field>
          <Input
            type="email"
            {...register("contactEmail", {
              required: t("Contact email is required"),
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: t("Invalid email address"),
              },
            })}
            placeholder={submitterEmail}
            className={inputClassName}
          />
          <FieldDescription>
            {t(
              "Leave your own email to have it marked as verified; another address stays unverified until confirmed.",
            )}
          </FieldDescription>
          <FieldError errors={[errors.contactEmail]} />
        </Field>
      </section>

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

    </div>
  );
});

export default StepContact;
