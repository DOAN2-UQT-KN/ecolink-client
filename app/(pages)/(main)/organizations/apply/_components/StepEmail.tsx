import { memo } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/client/shared/Button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useApplication } from "../_hooks/useApplication";

const inputClassName =
  "border-1 border-[rgba(136,122,71,0.5)] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-[rgba(136,122,71,0.5)]/50";

/**
 * The form needs no account, so proving control of the contact mailbox is the only thing
 * standing between it and spam. Everything after this step is authorised by the token this
 * exchange returns.
 */
export const StepEmail = memo(function StepEmail() {
  const { t } = useTranslation();
  const {
    form,
    otpSentAt,
    requestOtp,
    verifyOtp,
    isRequestingOtp,
    isVerifyingOtp,
  } = useApplication();
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="flex flex-col gap-6">
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
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="email"
            autoComplete="email"
            disabled={Boolean(otpSentAt)}
            {...register("email", {
              required: t("Contact email is required"),
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: t("Invalid email address"),
              },
            })}
            placeholder={t("contact@example.com")}
            className={inputClassName}
          />
          <Button
            variant="outlined-brown"
            onClick={requestOtp}
            isDisabled={isRequestingOtp}
            // className="sm:w-auto"
          >
            {otpSentAt ? t("Resend code") : t("Send code")}
          </Button>
        </div>
        <FieldError errors={[errors.email]} />
      </Field>

      {otpSentAt && (
        <Field>
          <FieldLabel className="text-foreground-tertiary font-display-3">
            {t("Verification code")} <span className="text-destructive">*</span>
          </FieldLabel>
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            {...register("otp", {
              required: t("Verification code is required"),
              pattern: {
                value: /^\d{6}$/,
                message: t("The code is 6 digits"),
              },
            })}
            placeholder="000000"
            className={`${inputClassName} tracking-[0.5em]`}
          />
          <FieldDescription>
            {t(
              "We sent a 6-digit code to that address. It expires in 10 minutes and can only be used once.",
            )}
          </FieldDescription>
          <FieldError errors={[errors.otp]} />
        </Field>
      )}

      <div className="flex justify-end">
        <Button
          variant="brown"
          onClick={verifyOtp}
          isDisabled={!otpSentAt || isVerifyingOtp}
        >
          {isVerifyingOtp ? t("Verifying...") : t("Continue")}
        </Button>
      </div>
    </div>
  );
});

export default StepEmail;
