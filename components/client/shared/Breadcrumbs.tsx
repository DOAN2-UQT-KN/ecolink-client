"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import React, { Fragment } from "react";
import { cn } from "@/libs/utils";

export interface BreadcrumbItemProps {
  label: string;
  path: string;
  type: "link" | "page";
}

interface BreadcrumbsProps {
  breadcrumbs: BreadcrumbItemProps[];
  isAdmin?: boolean;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ breadcrumbs, isAdmin = false }) => {
  const router = useRouter();
  const { t } = useTranslation("common");

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => (
          <Fragment key={item.path}>
            <BreadcrumbItem>
              {item.type === "link" ? (
                <BreadcrumbLink
                  className={cn("text-button-accent-hover cursor-pointer", isAdmin && "text-foreground-secondary hover:text-black")}
                  onClick={() => router.push(item.path)}
                >
                  {t(item.label)}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className={cn("text-button-accent", isAdmin && "text-black")}>
                  {t(item.label)}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
