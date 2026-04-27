import { PRIORITY } from "@/constants/priority";
import { Dropdown, Tag } from "antd";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

interface TagPriorityProps {
  type: number;
  onChangePriority?: (value: number) => void;
  enabledDropdown?: boolean;
}

const ChangePriority: React.FC<TagPriorityProps> = ({
  type,
  onChangePriority,
  enabledDropdown = true,
}) => {
  const { t } = useTranslation();
  const [currentPriority, setCurrentPriority] = useState<number>(type);

  useEffect(() => {
    setCurrentPriority(type);
  }, [type]);

  const filterColorByType = useCallback((priority: number) => {
    switch (priority) {
      case PRIORITY.HIGH:
        return "red";
      case PRIORITY.MEDIUM:
        return "blue";
      case PRIORITY.LOW:
        return "yellow";
      default:
        return "default";
    }
  }, []);

  const renderNamePriority = useCallback(() => {
    switch (currentPriority) {
      case PRIORITY.HIGH:
        return t("High");
      case PRIORITY.MEDIUM:
        return t("Medium");
      case PRIORITY.LOW:
        return t("Low");
      default:
        return "";
    }
  }, [currentPriority, t]);

  const priorityOptions = useMemo(
    () => [
      { label: t("High"), value: PRIORITY.HIGH, color: "#F5222D" },
      { label: t("Medium"), value: PRIORITY.MEDIUM, color: "#1677FF" },
      { label: t("Low"), value: PRIORITY.LOW, color: "#FADB14" },
    ],
    [t]
  );

  const handleChangePriority = useCallback(
    (value: number) => {
      setCurrentPriority(value);
      onChangePriority?.(value);
    },
    [onChangePriority]
  );

  const menuItems = useMemo(
    () =>
      priorityOptions.map((item) => ({
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
        onClick: () => handleChangePriority(item.value),
      })),
    [priorityOptions, handleChangePriority]
  );

  if (!enabledDropdown) {
    return (
      <Tag
        className="min-w-24 text-center rounded-md pb-0.5 mx-auto cursor-pointer"
        color={filterColorByType(currentPriority)}
      >
        {renderNamePriority()}
      </Tag>
    );
  }

  if (!currentPriority) return null;

  return (
    <Dropdown menu={{ items: menuItems }} trigger={["hover"]}>
      <Tag
        className="min-w-24 text-center rounded-md pb-0.5 mx-auto cursor-pointer"
        color={filterColorByType(currentPriority)}
      >
        {renderNamePriority()}
      </Tag>
    </Dropdown>
  );
};

export default ChangePriority;
