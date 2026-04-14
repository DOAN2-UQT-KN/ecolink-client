"use client";

import { Button } from "@/components/client/shared/Button";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useRequestPasswordReset } from "@/apis/auth/requestPasswordReset";

import { IRequestResetPasswordFormValues } from "./_services/auth.service";

export default function RequestResetPassword() {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IRequestResetPasswordFormValues>();

  const { mutate, isPending } = useRequestPasswordReset({
    onSuccess: () => {
      // Success message is handled in the hook
      router.push("/sign-in"); // User might want to stay to see the message or go back
    },
  });

  const onSubmit = async (data: IRequestResetPasswordFormValues) => {
    mutate(data);
  };

  return (
    <div className="lg:w-2/5 w-full flex flex-col items-center bg-white min-h-screen">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col justify-center lg:justify-center gap-[30px] px-[20px] lg:px-[70px] lg:py-[100px] h-full w-full"
      >
        {/* TITLE */}
        <div className="flex flex-col gap-[10px] text-center lg:text-left">
          <span className="font-display-7 lg:font-display-8 font-semibold text-background-quaternary">
            {t("Reset Password")}
          </span>
          <p className="text-background-tertiary font-display-2 font-regular">
            {t(
              "Enter your email address and we'll send you a link to reset your password.",
            )}
          </p>
        </div>

        {/* FIELDS */}
        <div className="flex flex-col gap-[20px]">
          {/* EMAIL */}
          <Field>
            <FieldLabel htmlFor="email">
              {t("Email")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder={t("example@email.com")}
              {...register("email", {
                required: t("Email is required"),
                pattern: {
                  value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/,
                  message: t("Invalid email format"),
                },
              })}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <span className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </span>
            )}
          </Field>
        </div>

        {/* ACTION */}
        <div className="flex flex-row items-center w-full gap-[15px]">
          <Button
            type="button"
            variant="outlined-green"
            className="flex-1 h-[60px]"
            onClick={() => router.push("/sign-in")}
            disabled={isPending}
          >
            <span className="!font-normal !font-display-3 px-2">
              {t("Cancel")}
            </span>
          </Button>
          <Button
            type="submit"
            variant="green"
            className="flex-1 h-[60px]"
            isLoading={isPending}
          >
            <span className="!font-normal !font-display-3 px-2">
              {t("Confirm")}
            </span>
          </Button>
        </div>

        {/* FOOTER */}
        <div className="flex flex-row justify-center items-center gap-[5px] w-full">
          <span
            className="text-background-tertiary font-display-2 font-regular underline cursor-pointer hover:text-background-quaternary transition-colors"
            onClick={() => router.push("/sign-in")}
          >
            {t("Back to Sign In")}
          </span>
        </div>
      </form>
    </div>
  );
}
