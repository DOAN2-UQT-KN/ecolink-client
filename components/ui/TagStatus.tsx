"use client";

import { Tag } from "antd";
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { STATUS } from "@/constants/status";
import { cn } from "@/libs/utils";

interface TagTicketProps {
  type: number;
  className?: string;
  isBom?: boolean;
}

const TagStatus: React.FC<TagTicketProps> = ({ type, className, isBom }) => {
  const { t } = useTranslation();

  const filterColorByType = useCallback((type: number) => {
    switch (type) {
      case STATUS.ACTIVE:
      case STATUS.APPROVED:
      case STATUS.CONFIRMED:
      case STATUS.COMPLETED:
        return "green";
      case STATUS.INACTIVE:
      case STATUS.DELETED:
      case STATUS.REJECTED:
      case STATUS.FAILED:
      case STATUS.CANCELED:
      case STATUS.CLOSED:
      case STATUS.UPLOAD_FAILED:
        return "red";
      case STATUS.DRAFT:
      case STATUS.PENDING:
      case STATUS.TODO:
        return "default";
      case STATUS.NEW:
      case STATUS.RECEIVED:
        return "cyan";
      case STATUS.WAITING_APPROVED:
      case STATUS.WAITING_CONFIRMED:
        return "orange";
      case STATUS.VERIFIED:
      case STATUS.IN_PROGRESS:
        return "blue";
      case STATUS.OBSOLETE:
        return "lime";
      default:
        return "";
    }
  }, []);

  const renderNameStatus = useCallback(() => {
    switch (type) {
      case STATUS.ACTIVE:
        return t("Active");
      case STATUS.INACTIVE:
        return t("Inactive");
      case STATUS.DELETED:
        return t("Deleted");
      case STATUS.DRAFT:
        return t("Draft");
      case STATUS.NEW:
        return isBom ? t("Submitted") : t("New");
      case STATUS.WAITING_APPROVED:
        return t("Waiting Approved");
      case STATUS.WAITING_CONFIRMED:
        return isBom ? t("In review") : t("Waiting Confirmed");
      case STATUS.REVIEWED:
        return t("Reviewed");
      case STATUS.ASSIGNED:
        return t("Assigned");
      case STATUS.CANCELED:
        return t("Canceled");
      case STATUS.PENDING:
        return t("Pending");
      case STATUS.VERIFIED:
        return t("Verified");
      case STATUS.APPROVED:
        return t("Approved");
      case STATUS.RECEIVED:
        return t("Received");
      case STATUS.CONFIRMED:
        return t("Confirmed");
      case STATUS.COMPLETED:
        return t("Completed");
      case STATUS.REJECTED:
        return t("Rejected");
      case STATUS.RETURNED:
        return t("Returned");
      case STATUS.OBSOLETE:
        return t("Obsolete");
      case STATUS.TODO:
        return t("To Do");
      case STATUS.IN_PROGRESS:
        return t("In Progress");
      case STATUS.CLOSED:
        return t("Closed");
      case STATUS.FAILED:
      case STATUS.UPLOAD_FAILED:
        return t("Failed");
      default:
        return "";
    }
  }, [type, t]);

  if (!type) return null;

  return (
    <Tag
      className={cn(
        "min-w-24 text-center rounded-md pb-0.5 mx-auto ",
        className
      )}
      color={filterColorByType(type)}
    >
      {renderNameStatus()}
    </Tag>
  );
};

export default TagStatus;
