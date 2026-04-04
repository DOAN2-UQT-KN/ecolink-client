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

export interface BreadcrumbItemProps {
  label: string;
  path: string;
  type: "link" | "page";
}

interface BreadcrumbsProps {
  breadcrumbs: BreadcrumbItemProps[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ breadcrumbs }) => {
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
                  className="text-button-accent-hover cursor-pointer"
                  onClick={() => router.push(item.path)}
                >
                  {t(item.label)}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="text-button-accent">
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
