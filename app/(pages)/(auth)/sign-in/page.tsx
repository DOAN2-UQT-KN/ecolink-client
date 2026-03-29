"use client";

import { Button } from "@/components/shared/Button";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { useSignIn } from "@/apis/auth/signIn";
import useAuthStore from "@/stores/useAuthStore";
import { useState } from "react";
import { HiEye, HiEyeOff } from "react-icons/hi";

type FormValues = {
  email: string;
  password: string;
};

export default function SignIn() {
  const { t } = useTranslation();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const { mutate, isPending } = useSignIn({
    onSuccess: (res) => {
      if (res.data) {
        const { accessToken, refreshToken, user } = res.data;

        // Set access token and user in store
        useAuthStore
          .getState()
          .setLoginSuccess(accessToken, user, refreshToken);

        // Set refresh token in cookie
        document.cookie = `refresh_token=${refreshToken}; path=/; Max-Age=2592000; Secure; SameSite=Lax`;

        router.push("/");
      }
    },
  });

  const onSubmit = async (data: FormValues) => {
    mutate(data);
  };

  return (
    <div className="lg:w-2/5 w-full flex flex-col items-center bg-white min-h-screen">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col justify-center lg:justify-center gap-[30px] px-[20px] lg:px-[70px] lg:py-[100px] h-full"
      >
        {/* TITLE */}
        <div className="flex flex-col text-center lg:text-left gap-[10px]">
          <span className="font-display-7 lg:font-display-8 font-semibold text-background-quaternary">
            {t("Sign in")}
          </span>
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

          {/* PASSWORD */}
          <Field>
            <FieldLabel htmlFor="password">
              {t("Password")} <span className="text-destructive">*</span>
            </FieldLabel>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password", {
                  required: t("Password is required"),
                  minLength: {
                    value: 6,
                    message: t("Password must be at least 6 characters"),
                  },
                })}
                aria-invalid={!!errors.password}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary hover:text-foreground focus:outline-none  cursor-pointer transition-all duration-300"
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

            {errors.password && (
              <span className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </span>
            )}
          </Field>
        </div>

        {/* ACTION */}
        <div className="flex flex-col items-center w-full lg:w-[373px] gap-[15px]">
          <Button
            type="submit"
            variant="green"
            className="w-full h-[60px]"
            disabled={isPending}
          >
            <span className="!font-normal !font-display-3 px-2">
              {isPending ? t("Loading...") : t("Sign in")}
            </span>
          </Button>

          <div className="flex flex-row items-center gap-[13px] text-background-tertiary">
            <div className="flex-1 lg:w-[133px] h-[1px] bg-background-tertiary"></div>
            <span className="uppercase font-display-4 font-normal text-background-tertiary">
              {t("or")}
            </span>
            <div className="flex-1 lg:w-[133px] h-[1px] bg-background-tertiary"></div>
          </div>

          <Button variant="outlined-green" className="w-full h-[60px]">
            <div className="flex flex-row items-center gap-[10px]">
              <Image src="/google.png" alt="google" width={25} height={25} />
              <span className="!font-medium !font-display-3 px-2">
                {t("Sign in with Google")}
              </span>
            </div>
          </Button>
        </div>

        {/* FOOTER */}
        <div className="flex flex-row justify-start items-start gap-[5px] w-full lg:w-[373px]">
          <span className="text-background-tertiary font-display-2 font-regular">
            {t("Don't have an account?")}
          </span>
          <span
            className="text-background-tertiary font-display-2 font-regular underline cursor-pointer"
            onClick={() => router.push("/sign-up")}
          >
            {t("Sign up")}
          </span>
        </div>
      </form>
    </div>
  );
}
