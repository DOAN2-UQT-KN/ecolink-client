import { memo } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { TbLock } from "react-icons/tb";

import { Button } from "@/components/client/shared/Button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/libs/utils";
import { useApplication } from "../_hooks/useApplication";
import { formatCountdown, useCountdown } from "../_hooks/useCountdown";
import { OtpInput } from "./OtpInput";

const inputClassName =
  "border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50";

export const stepCardClassName =
  "rounded-[10px] border border-[rgba(136,122,71,0.5)] bg-white/80 px-[24px] py-[28px] shadow-sm lg:px-[30px] lg:py-[35px]";

/**
 * The form needs no account, so proving control of the contact mailbox is the only thing
 * standing between it and spam. Everything after this step is authorised by the token this
 * exchange returns.
 */
export const StepEmail = memo(function StepEmail() {
  const { t } = useTranslation();
  const {
    form,
    otpExpiresAt,
    isEmailLocked,
    changeEmail,
    requestOtp,
    verifyOtp,
    isRequestingOtp,
    isVerifyingOtp,
  } = useApplication();
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;

  const isOtpSent = Boolean(otpExpiresAt);
  const secondsLeft = useCountdown(otpExpiresAt);
  const email = watch("email");

  return (
    <div className="flex flex-col gap-[30px] lg:flex-row">
      {/* Card 1 — the address to prove */}
      <div className={cn(stepCardClassName, "flex flex-1 flex-col gap-6")}>
        <div className="flex flex-col gap-1">
          <h2 className="font-display-5 font-semibold !text-button-accent">
            {t("Verify your organization's contact email")}
          </h2>
          <p className="text-sm text-foreground-tertiary">
            {t(
              "This address becomes the organization's public contact and the login of its account, so make sure you can read mail there.",
            )}
          </p>
        </div>

        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Contact email")} <span className="text-destructive">*</span>
          </FieldLabel>
          <div className="relative">
            <Input
              type="email"
              autoComplete="email"
              disabled={isOtpSent || isEmailLocked}
              {...register("email", {
                required: t("Contact email is required"),
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: t("Invalid email address"),
                },
              })}
              placeholder={t("contact@example.com")}
              aria-invalid={!!errors.email}
              className={cn(inputClassName, isEmailLocked && "pr-10")}
            />
            {isEmailLocked && (
              <TbLock className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-foreground-tertiary" />
            )}
          </div>
          <FieldError errors={[errors.email]} />
        </Field>

        <div className="mt-auto flex flex-wrap items-center justify-end gap-3">
          {isOtpSent && !isEmailLocked && (
            <button
              type="button"
              onClick={changeEmail}
              className="text-sm text-button-accent underline-offset-4 hover:underline"
            >
              {t("Change email")}
            </button>
          )}
          {!isOtpSent && (
            <Button
              variant="brown"
              onClick={requestOtp}
              isDisabled={isRequestingOtp}
            >
              {isRequestingOtp ? t("Sending...") : t("Send code")}
            </Button>
          )}
        </div>
      </div>

      {/* Card 2 — the code from the inbox; only once one has been sent */}
      {isOtpSent && (
        <div
          className={cn(
            stepCardClassName,
            "flex flex-1 flex-col items-center gap-6 text-center",
          )}
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-display-5 font-semibold !text-button-accent">
              {t("Enter your one-time code")}
            </h2>
            <p className="text-sm text-foreground-tertiary">
              {t("We sent a 6-digit code to")}{" "}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Controller
              control={control}
              name="otp"
              rules={{
                required: t("Verification code is required"),
                pattern: {
                  value: /^\d{6}$/,
                  message: t("The code is 6 digits"),
                },
              }}
              render={({ field }) => (
                <OtpInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={Boolean(errors.otp)}
                />
              )}
            />
            <FieldError errors={[errors.otp]} />
          </div>

          <Button
            variant="brown"
            onClick={verifyOtp}
            isDisabled={isVerifyingOtp}
            className="min-w-[240px]"
          >
            {isVerifyingOtp ? t("Verifying...") : t("Verify & continue")}
          </Button>

          <div className="flex flex-col items-center gap-1 text-sm text-foreground-tertiary">
            <p>
              {secondsLeft > 0
                ? t("Code expires in {{time}}", {
                    time: formatCountdown(secondsLeft),
                  })
                : t("The code has expired, please request a new one.")}
            </p>
            <p>
              {t("Didn't get it?")}{" "}
              <button
                type="button"
                onClick={requestOtp}
                disabled={isRequestingOtp}
                className="font-semibold text-button-accent underline-offset-4 hover:underline disabled:opacity-50"
              >
                {isRequestingOtp ? t("Sending...") : t("Resend code")}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default StepEmail;
