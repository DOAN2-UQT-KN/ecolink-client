import { STATUS } from "@/constants/status";
import { statusTone } from "@/constants/statusTone";
import { cn } from "@/libs/utils";
import { Dropdown } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { PILL_DOT } from "./Pill";
import { StatusPill } from "./StatusPill";

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

  const statusOptionDefault = useMemo(
    () => [
      { label: t("New"), value: STATUS.NEW },
      { label: t("Waiting confirm"), value: STATUS.WAITING_CONFIRMED },
      { label: t("Waiting approved"), value: STATUS.WAITING_APPROVED },
      { label: t("Approve"), value: STATUS.APPROVED },
      { label: t("Active"), value: STATUS.ACTIVE },
      { label: t("Inactive"), value: STATUS.INACTIVE },
      { label: t("Canceled"), value: STATUS.CANCELED },
      { label: t("Reject"), value: STATUS.REJECTED },
      { label: t("Completed"), value: STATUS.COMPLETED },
      { label: t("Failed"), value: STATUS.FAILED },
      { label: t("In progress"), value: STATUS.IN_PROGRESS },
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
              className={cn("inline-block size-2.5 rounded-full", PILL_DOT[statusTone(item.value)])}
            />
            <span>{item.label}</span>
          </div>
        ),
        onClick: () => handleChangeStatus(item.value),
      })),
    [statusOption, handleChangeStatus]
  );

  if (!enabledDropdown || statusOption.length === 0) {
    return <StatusPill type={currentStatus} />;
  }

  if (!currentStatus) return null;

  return (
    <Dropdown menu={{ items: menuItems }} trigger={["hover"]}>
      <StatusPill type={currentStatus} className="cursor-pointer" />
    </Dropdown>
  );
};

export default ChangeStatus;
