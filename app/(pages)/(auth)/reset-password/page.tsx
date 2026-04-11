"use client";

import { Button } from "@/components/shared/Button";
import { useTranslation } from "react-i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useResetPassword } from "@/apis/auth/resetPassword";
import { useState, Suspense } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { IResetPasswordFormValues } from "./_services/auth.service";

function ResetPasswordContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("reset_token");

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<IResetPasswordFormValues>();

  const { mutate, isPending } = useResetPassword({
    onSuccess: () => {
      router.push("/sign-in");
    },
  });

  const onSubmit = async (data: IResetPasswordFormValues) => {
    if (!resetToken) {
      return;
    }
    mutate({
      resetToken,
      newPassword: data.newPassword,
    });
  };

  if (!resetToken) {
    return (
      <div className="lg:w-2/5 w-full flex flex-col items-center justify-center bg-white min-h-screen gap-3">
        <div className="text-center p-4">
          <div className="font-display-9 font-bold text-foreground-quaternary mb-2">
            {t("Invalid Reset Token")}
          </div>
          <p className="text-background-tertiary mb-4">
            {t("The password reset link is invalid or has expired.")}
          </p>
          <Button variant="green" onClick={() => router.push("/sign-in")}>
            {t("Back to Sign In")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:w-2/5 w-full flex flex-col items-center bg-white min-h-screen">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col justify-center lg:justify-center gap-[30px] px-[20px] lg:px-[70px] lg:py-[100px] h-full w-full max-w-[500px]"
      >
        <div className="flex flex-col text-center lg:text-left gap-[10px]">
          <span className="font-display-7 lg:font-display-8 font-semibold text-background-quaternary">
            {t("Reset Password")}
          </span>
          <p className="text-background-tertiary">
            {t("Please enter your new password below.")}
          </p>
        </div>

        <div className="flex flex-col gap-[20px]">
          <Field>
            <FieldLabel htmlFor="newPassword">
              {t("New password")} <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("newPassword", {
                  required: t("New password is required"),
                  minLength: {
                    value: 6,
                    message: t("Password must be at least 6 characters"),
                  },
                })}
                aria-invalid={!!errors.newPassword}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary hover:text-foreground focus:outline-none cursor-pointer transition-all duration-300"
                aria-label={
                  showPassword ? t("Hide password") : t("Show password")
                }
              >
                {showPassword ? (
                  <HiEyeOff className="h-5 w-5" />
                ) : (
                  <HiEye className="h-5 w-5" />
                )}
              </button>
            </div>

            {errors.newPassword && (
              <span className="text-red-500 text-sm mt-1">
                {errors.newPassword.message}
              </span>
            )}
          </Field>
        </div>

        <div className="flex flex-row items-center w-full gap-[15px]">
          <Button
            type="submit"
            variant="green"
            className="w-full h-[60px]"
            disabled={isPending}
          >
            <span className="!font-normal !font-display-3 px-2">
              {isPending ? t("Loading...") : t("Confirm")}
            </span>
          </Button>

          <Button
            type="button"
            variant="outlined-green"
            className="w-full h-[60px]"
            onClick={() => router.push("/sign-in")}
          >
            <span className="!font-medium !font-display-3 px-2">
              {t("Cancel")}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function ResetPassword() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div>{t("Loading...")}</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
