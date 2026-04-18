"use client";

import { Button } from "@/components/client/shared/Button";
import Image from "next/image";
import { Trans, useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { useSignUp } from "@/apis/auth/signUp";

import { ISignUpFormValues } from "./_services/auth.service";

export default function SignUp() {
  const { t } = useTranslation();
  const router = useRouter();
  const [isAgreed, setIsAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ISignUpFormValues>();

  const { mutate, isPending } = useSignUp({
    onSuccess: () => {
      router.push("/sign-in");
    },
  });

  const onSubmit = async (data: ISignUpFormValues) => {
    mutate(data);
  };

  return (
    <div className="lg:w-2/5 w-full flex flex-col items-center bg-white min-h-screen">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col justify-center lg:justify-center gap-[30px] px-[20px] lg:px-[70px] lg:py-[30px] h-full"
      >
        {/* TITLE */}
        <div className="flex flex-col text-center lg:text-left gap-[8px]">
          <span className="font-display-7 lg:font-display-8 font-semibold text-background-quaternary">
            {t("Create an account")}
          </span>
        </div>

        {/* FIELDS */}
        <div className="flex flex-col gap-[15px]">
          {/* FULL NAME */}
          <Field>
            <FieldLabel htmlFor="fullName">
              {t("Full name")} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              id="fullName"
              placeholder={t("Nguyen Van A")}
              {...register("name", {
                required: t("Full name is required"),
                minLength: {
                  value: 3,
                  message: t("Name must be at least 3 characters"),
                },
              })}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <span className="text-red-500 text-sm">
                {errors.name.message}
              </span>
            )}
          </Field>

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

            {errors.password && (
              <span className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </span>
            )}
          </Field>
        </div>

        {/* ACTION */}
        <div className="flex flex-col items-center w-full lg:w-[373px] gap-[15px]">
          <div className="flex flex-row gap-2 items-start justify-start">
            <div className="pt-1">
              <Checkbox
                checked={isAgreed}
                onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
              />
            </div>
            <span className="text-foreground-tertiary font-display-1 lg:font-display-2 text-justify">
              <Trans
                ns="common"
                i18nKey="agreeSignUp"
                components={[<span key="0" className="underline" />]}
              />
            </span>
          </div>
          <Button
            type="submit"
            variant="green"
            className="w-full h-[60px]"
            disabled={isPending || !isAgreed}
          >
            <span className="!font-normal !font-display-3 px-2">
              {isPending ? t("Loading...") : t("Sign up")}
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
                {t("Sign up with Google")}
              </span>
            </div>
          </Button>
        </div>

        {/* FOOTER */}
        <div className="flex flex-row justify-start items-center gap-[5px] w-full lg:w-[373px]">
          <span className="text-background-tertiary font-display-2 font-regular">
            {t("Already have an account?")}
          </span>
          <span
            className="text-background-tertiary font-display-2 font-regular underline cursor-pointer"
            onClick={() => router.push("/sign-in")}
          >
            {t("Sign in")}
          </span>
        </div>
      </form>
    </div>
  );
}
