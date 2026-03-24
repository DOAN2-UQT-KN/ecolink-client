"use client";

import { Button } from "@/components/shared/Button";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";

type FormValues = {
  email: string;
  password: string;
};

export default function SignIn() {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    console.log("Form data:", data);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    alert(t("Sign in success (mock)"));
    router.push("/dashboard");
  };

  return (
    <div className="lg:w-2/5 w-full flex flex-col items-center bg-white min-h-screen">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col justify-center lg:justify-between gap-[30px] px-[20px] lg:px-[70px] lg:py-[100px] h-full"
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
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password", {
                required: t("Password is required"),
                minLength: {
                  value: 6,
                  message: t("Password must be at least 6 characters"),
                },
              })}
              aria-invalid={!!errors.password}
            />

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
            disabled={isSubmitting}
          >
            <span className="!font-normal !font-display-3 px-2">
              {isSubmitting ? t("Loading...") : t("Sign in")}
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
