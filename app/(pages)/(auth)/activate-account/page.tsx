import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { HiEye, HiEyeOff } from "react-icons/hi";

import { useActivateAccount } from "@/apis/auth/activateAccount";
import { Button } from "@/components/client/shared/Button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRouter, useSearchParams } from "@/libs/router";

interface IActivateAccountFormValues {
  newPassword: string;
  confirmPassword: string;
}

/** identity-service rejects anything shorter. */
const MIN_PASSWORD_LENGTH = 8;

/**
 * Landing page of the activation email. An approved organization owner who had no Ecolink
 * account gets a personal account created for their email; this sets its first password.
 */
export default function ActivateAccountPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<IActivateAccountFormValues>();

  const { mutate, isPending } = useActivateAccount({
    onSuccess: () => {
      router.push("/sign-in");
    },
  });

  const onSubmit = (data: IActivateAccountFormValues) => {
    mutate({ token, newPassword: data.newPassword });
  };

  if (!token) {
    return (
      <div className="lg:w-2/5 w-full flex flex-col items-center justify-center bg-white min-h-screen gap-3">
        <div className="text-center p-4">
          <div className="font-display-7 font-bold text-background-quaternary mb-2">
            {t("Invalid activation link")}
          </div>
          <p className="text-background-tertiary mb-4">
            {t("This activation link is invalid or has expired.")}
          </p>
          <Button variant="green" onClick={() => router.push("/sign-in")}>
            {t("Back to Sign In")}
          </Button>
        </div>
      </div>
    );
  }

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((current) => !current)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary hover:text-foreground focus:outline-none cursor-pointer transition-all duration-300"
      aria-label={showPassword ? t("Hide password") : t("Show password")}
    >
      {showPassword ? (
        <HiEyeOff className="h-5 w-5" />
      ) : (
        <HiEye className="h-5 w-5" />
      )}
    </button>
  );

  return (
    <div className="lg:w-2/5 w-full flex flex-col items-center bg-white min-h-screen">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col justify-center gap-[30px] px-[20px] lg:px-[70px] lg:py-[100px] h-full w-full max-w-[500px]"
      >
        <div className="flex flex-col text-center lg:text-left gap-[10px]">
          <span className="font-display-7 lg:font-display-8 font-semibold text-background-quaternary">
            {t("Activate your account")}
          </span>
          <p className="text-background-tertiary">
            {t(
              "You were approved as an organization owner. Set a password for your account — you will sign in with the email the invitation was sent to.",
            )}
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
                autoComplete="new-password"
                placeholder="••••••••"
                {...register("newPassword", {
                  required: t("New password is required"),
                  minLength: {
                    value: MIN_PASSWORD_LENGTH,
                    message: t("Password must be at least 8 characters"),
                  },
                })}
                aria-invalid={!!errors.newPassword}
                className="pr-10"
              />
              {passwordToggle}
            </div>
            {errors.newPassword && (
              <span className="text-red-500 text-sm mt-1">
                {errors.newPassword.message}
              </span>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">
              {t("Confirm password")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              {...register("confirmPassword", {
                required: t("Please confirm your password"),
                validate: (value) =>
                  value === getValues("newPassword") ||
                  t("Passwords do not match"),
              })}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <span className="text-red-500 text-sm mt-1">
                {errors.confirmPassword.message}
              </span>
            )}
          </Field>
        </div>

        <Button
          type="submit"
          variant="green"
          className="w-full h-[60px]"
          disabled={isPending}
        >
          <span className="!font-normal !font-display-3 px-2">
            {isPending ? t("Loading...") : t("Activate account")}
          </span>
        </Button>
      </form>
    </div>
  );
}
