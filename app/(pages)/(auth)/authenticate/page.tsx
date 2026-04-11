"use client";

import { Button } from "@/components/shared/Button";
import Image from "next/image";
import { Trans, useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";

export default function Authenticate() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="lg:w-2/5 w-full flex flex-col items-center bg-white">
      <div className="flex flex-col items-center justify-center lg:justify-between gap-[35px] px-[20px] lg:px-[70px] lg:py-[120px] h-full">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-[10px] py-[10px] w-full">
          <span className="font-display-8 lg:font-display-9 font-semibold text-background-quaternary">
            {t("Save our planet")}
          </span>
          <span className="font-display-7 lg:font-display-8 font-regular text-background-tertiary">
            {t("Join us today")}
          </span>
        </div>

        <div className="flex flex-col items-center w-full lg:w-[373px] gap-[15px]">
          <Button variant="outlined-green" className="w-full h-[60px]">
            <div className="flex flex-row items-center gap-[10px]">
              <Image src="/google.png" alt="google" width={25} height={25} />
              <span className="!font-medium !font-display-3 px-2">
                {t("Sign up with Google")}
              </span>
            </div>
          </Button>

          <div className="flex flex-row items-center gap-[13px] text-background-tertiary">
            <div className="flex-1 lg:w-[133px] h-[1px] bg-background-tertiary"></div>
            <span className="uppercase font-display-4 font-normal text-background-tertiary">
              {t("or")}
            </span>
            <div className="flex-1 lg:w-[133px] h-[1px] bg-background-tertiary"></div>
          </div>

          <Button
            variant="green"
            className="w-full h-[60px]"
            onClick={() => router.push("/sign-up")}
          >
            <span className="!font-normal !font-display-3 px-2">
              {t("Sign up with email")}
            </span>
          </Button>

          <span className="text-foreground-tertiary font-display-1 lg:font-display-2 font-regular text-justify  ">
            <Trans
              ns="common"
              i18nKey="agreeSignUp"
              components={[<span key="0" className="underline" />]}
            />
          </span>
        </div>

        <div className="flex flex-col items-start gap-[15px] w-full lg:w-[373px]">
          <span className="text-background-tertiary font-display-2 font-regular">
            {t("Already have an account?")}
          </span>
          <Button
            variant="outlined-green"
            className="h-[60px] w-full"
            onClick={() => router.push("/sign-in")}
          >
            <span className="!font-normal !font-display-3 px-2">
              {t("Sign in")}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
