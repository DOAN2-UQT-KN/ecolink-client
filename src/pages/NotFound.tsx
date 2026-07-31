import { useTranslation } from "react-i18next";
import { MapPinOff } from "lucide-react";

import { Button } from "@/components/client/shared/Button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useRouter } from "@/libs/router";

export default function NotFound() {
  const { t } = useTranslation("common");
  const router = useRouter();

  return (
    <section
      aria-labelledby="not-found-title"
      className="flex min-h-[50vh] w-full items-center justify-center bg-background-primary font-sans dark:bg-black"
    >
      <Empty className="max-w-lg border-none bg-transparent p-6 md:p-12">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="bg-background-secondary/40 text-background-quaternary dark:bg-background-quaternary/20">
            <MapPinOff aria-hidden="true" className="size-6" />
          </EmptyMedia>
          <p
            className="font-title text-[72px] leading-none text-background-quaternary md:text-[96px]"
            aria-hidden="true"
          >
            404
          </p>
          <EmptyTitle
            id="not-found-title"
            className="font-title text-2xl text-foreground-primary md:text-3xl dark:text-white"
          >
            {t("notFound.title")}
          </EmptyTitle>
          <EmptyDescription className="font-display-2 text-foreground-secondary dark:text-foreground-tertiary">
            {t("notFound.message")}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            variant="green"
            size="medium"
            onClick={() => router.push("/")}
          >
            {t("notFound.backHome")}
          </Button>
        </EmptyContent>
      </Empty>
    </section>
  );
}
