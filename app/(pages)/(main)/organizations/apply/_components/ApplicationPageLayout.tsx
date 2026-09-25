import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import {
  Breadcrumbs,
  BreadcrumbItemProps,
} from "@/components/client/shared/Breadcrumbs";
import { Button } from "@/components/client/shared/Button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/libs/router";
import { cn } from "@/libs/utils";
import { stepCardClassName } from "./StepEmail";

/** Breadcrumbs plus the single card the submitted and tracking pages live in. */
export function ApplicationPageLayout({
  breadcrumbs,
  children,
}: {
  breadcrumbs: BreadcrumbItemProps[];
  children: ReactNode;
}) {
  return (
    <div className="w-full h-full">
      <Breadcrumbs breadcrumbs={breadcrumbs} />
      <div className="flex justify-center pt-5 animate-in fade-in slide-in-from-top-4 duration-500">
        <div
          className={cn(stepCardClassName, "flex w-full max-w-4xl flex-col gap-6")}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function ApplicationDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Skeleton className="size-[72px] rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-7 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

export function ApplicationNotFound({ message }: { message: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-4">
      <h2 className="font-display-6 font-semibold !text-button-accent">
        {t("Application not found")}
      </h2>
      <p className="text-sm text-foreground-tertiary">{message}</p>
      <Link href="/organizations">
        <Button variant="outlined-brown">{t("Browse organizations")}</Button>
      </Link>
    </div>
  );
}
