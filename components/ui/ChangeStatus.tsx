import { STATUS } from "@/constants/status";
import { Dropdown, Tag } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface TagTicketProps {
  type: number;
  onChangeStatus?: (value: number) => void;
  enabledDropdown?: boolean;
  statusOptions?: STATUS[];
}

const ChangeStatus: React.FC<TagTicketProps> = ({
  type,
  onChangeStatus,
  enabledDropdown = true,
  statusOptions,
}) => {
  const { t } = useTranslation();
  const [currentStatus, setCurrentStatus] = useState<number>(type);

  useEffect(() => {
    setCurrentStatus(type);
  }, [type]);

  const filterColorByType = useCallback((status: number) => {
    switch (status) {
      case STATUS.ACTIVE:
      case STATUS.APPROVED:
      case STATUS.COMPLETED:
        return "green";
      case STATUS.INACTIVE:
      case STATUS.DELETED:
      case STATUS.REJECTED:
      case STATUS.FAILED:
      case STATUS.CLOSED:
      case STATUS.CANCELED:
        return "red";
      case STATUS.DRAFT:
        return "default";
      case STATUS.NEW:
        return "cyan";
      case STATUS.WAITING_APPROVED:
      case STATUS.WAITING_CONFIRMED:
        return "orange";
      case STATUS.PENDING:
        return "";
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
    switch (currentStatus) {
      case STATUS.ACTIVE:
        return t("Active");
      case STATUS.INACTIVE:
        return t("Inactive");
      case STATUS.DELETED:
        return t("Deleted");
      case STATUS.DRAFT:
        return t("Draft");
      case STATUS.NEW:
        return t("New");
      case STATUS.WAITING_APPROVED:
        return t("Waiting Approved");
      case STATUS.WAITING_CONFIRMED:
        return t("Waiting Confirmed");
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
      case STATUS.FAILED:
        return t("Failed");
      case STATUS.CLOSED:
        return t("Closed");
      case STATUS.TODO_BYPASS:
        return t("To Do");
      default:
        return "";
    }
  }, [currentStatus, t]);

  const statusOptionDefault = useMemo(
    () => [
      {
        label: t("New"),
        value: STATUS.NEW,
        color: "#13C2C2",
      },
      {
        label: t("Waiting confirm"),
        value: STATUS.WAITING_CONFIRMED,
        color: "#FA541C",
      },
      {
        label: t("Waiting approved"),
        value: STATUS.WAITING_APPROVED,
        color: "#FA8C16",
      },
      { label: t("Approve"), value: STATUS.APPROVED, color: "#52C41A" },
      { label: t("Active"), value: STATUS.ACTIVE, color: "#52C41A" },
      { label: t("Inactive"), value: STATUS.INACTIVE, color: "#F5222D" },
      { label: t("Canceled"), value: STATUS.CANCELED, color: "#F5222D" },
      { label: t("Reject"), value: STATUS.REJECTED, color: "#F5222D" },
      { label: t("Completed"), value: STATUS.COMPLETED, color: "#52C41A" },
      { label: t("Failed"), value: STATUS.FAILED, color: "#F5222D" },
      { label: t("In progress"), value: STATUS.IN_PROGRESS, color: "#0958d9" },
    ],
    [t]
  );

  const statusOption = useMemo(() => {
    if (statusOptions) {
      return statusOptionDefault.filter((e) => statusOptions.includes(e.value));
    }
    switch (type) {
      case STATUS.DRAFT:
        return statusOptionDefault.filter((e) => e.value === STATUS.NEW);
      case STATUS.PENDING:
        return statusOptionDefault.filter((e) =>
          [STATUS.ACTIVE, STATUS.INACTIVE].includes(e.value)
        );
      case STATUS.NEW:
        return statusOptionDefault.filter(
          (e) => e.value === STATUS.WAITING_APPROVED
        );
      case STATUS.WAITING_CONFIRMED:
        return [];
      case STATUS.WAITING_APPROVED:
        return statusOptionDefault.filter((e) => e.value === STATUS.APPROVED);
      case STATUS.APPROVED:
        return [];
      case STATUS.ACTIVE:
        return statusOptionDefault.filter((e) => e.value === STATUS.INACTIVE);
      case STATUS.INACTIVE:
        return [];
      case STATUS.TODO:
        return statusOptionDefault.filter((e) =>
          [STATUS.ACTIVE, STATUS.INACTIVE].includes(e.value)
        );
      case STATUS.IN_PROGRESS:
        return statusOptionDefault.filter(
          (e) => e.value === STATUS.WAITING_APPROVED
        );
      case STATUS.TODO_BYPASS:
        return statusOptionDefault.filter((e) =>
          [STATUS.IN_PROGRESS].includes(e.value)
        );
      case STATUS.FAILED:
        return [];

      default:
        return [];
    }
  }, [type, statusOptionDefault, statusOptions]);

  const handleChangeStatus = useCallback(
    (value: number) => {
      setCurrentStatus(value);
      onChangeStatus?.(value);
    },
    [onChangeStatus]
  );

  const menuItems = useMemo(
    () =>
      statusOption.map((item) => ({
        key: item.value,
        label: (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: item.color,
                display: "inline-block",
              }}
            />
            <span>{item.label}</span>
          </div>
        ),
        onClick: () => handleChangeStatus(item.value),
      })),
    [statusOption, handleChangeStatus]
  );

  if (!enabledDropdown || statusOption.length === 0) {
    return (
      <Tag
        className="min-w-24 text-center rounded-md pb-0.5 mx-auto cursor-pointer"
        color={filterColorByType(currentStatus)}
      >
        {renderNameStatus()}
      </Tag>
    );
  }

  if (!currentStatus) return null;

  return (
    <Dropdown menu={{ items: menuItems }} trigger={["hover"]}>
      <Tag
        className="min-w-24 text-center rounded-md pb-0.5 mx-auto cursor-pointer"
        color={filterColorByType(currentStatus)}
      >
        {renderNameStatus()}
      </Tag>
    </Dropdown>
  );
};

export default ChangeStatus;
