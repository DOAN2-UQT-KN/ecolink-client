import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { IAdminUser } from "@/apis/user/models/getUsers";
import { useAdminLayout } from "@/app/(pages)/(admin)/_context/AdminLayoutContext";
import { StatusTag } from "@/components/ui/StatusTag";
import { RichTextContent } from "@/components/ui/RichTextContent";
import { cn } from "@/libs/utils";
import { useUserContext } from "../_context/UserContext";
import {
  DataTable as SharedDataTable,
  type DataTableColumn,
} from "@/components/admin/shared/DataTable";
import { BanUserConfirm } from "./BanUserConfirm";
import { PreviewUserPopover } from "./PreviewUserPopover";
import { TbCircleCheck, TbCircleX, TbScanEye } from "react-icons/tb";
import { formattedDate } from "@/utils/formattedDate";
import Image from "@/components/ui/AppImage";
import defaultAvatar from "@/public/default-avatar.png";
import { STATUS } from "@/constants/status";

const COLUMN_KEYS = {
  NO: "no",
  USER: "user",
  EMAIL: "email",
  ROLE: "role",
  CREATED: "created",
  STATUS: "status",
  REJECT_REASON: "reject_reason",
  ACTION: "action",
} as const;

export function DataTable() {
  const { t } = useTranslation();
  const { users, loading, pagination, total, onPageChange, onPageSizeChange } =
    useUserContext();
  const { theme } = useAdminLayout();
  const isDark = theme === "dark";

  const columns: DataTableColumn<IAdminUser>[] = useMemo(
    () => [
      {
        key: COLUMN_KEYS.NO,
        title: t("No"),
        className: "w-[72px]",
        render: (_, __, index) => (
          <span className="tabular-nums">
            {(pagination.current - 1) * pagination.pageSize + index + 1}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.USER,
        title: t("User"),
        className: "z-20 min-w-[220px]",
        sticky: "left",
        render: (_, record) => (
          <div className="flex items-center gap-3">
            <Image
              src={record.avatar || defaultAvatar}
              alt={record.name}
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <div
                className={cn(
                  "flex min-w-0 items-center gap-1.5 font-medium",
                  isDark ? "text-zinc-100" : "text-zinc-900",
                )}
              >
                <span className="truncate">{record.name}</span>
                {record.email_verified ? (
                  <TbCircleCheck
                    className="size-4 shrink-0 text-emerald-500"
                    aria-label={t("Verified")}
                    title={t("Verified")}
                  />
                ) : (
                  <TbCircleX
                    className="size-4 shrink-0 text-red-500"
                    aria-label={t("Unverified")}
                    title={t("Unverified")}
                  />
                )}
              </div>
              <span
                className={cn(
                  "truncate text-xs",
                  isDark ? "text-zinc-500" : "text-zinc-600",
                )}
              >
                {record.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: COLUMN_KEYS.EMAIL,
        title: t("Email"),
        className: "min-w-[200px]",
        render: (_, record) => (
          <span
            className={cn(
              "truncate text-sm",
              isDark ? "text-zinc-300" : "text-zinc-700",
            )}
          >
            {record.email}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.ROLE,
        title: t("Role"),
        className: "min-w-[100px]",
        render: (_, record) => (
          <span
            className={cn(
              "text-sm font-medium capitalize",
              isDark ? "text-zinc-300" : "text-zinc-700",
            )}
          >
            {record.role_name ?? "—"}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.CREATED,
        title: t("Created"),
        className: "min-w-[140px]",
        render: (_, record) => (
          <span
            className={cn(
              "font-display-1 text-sm",
              isDark ? "text-zinc-400" : "text-zinc-600",
            )}
          >
            {formattedDate(record.created_at ?? undefined)}
          </span>
        ),
      },
      {
        key: COLUMN_KEYS.STATUS,
        title: t("Status"),
        className: "min-w-[120px]",
        render: (_, record) => (
          <StatusTag
            status={record.status}
            className="!mx-0 min-w-0 justify-center"
            label={record.status === STATUS.INACTIVE ? t("Banned") : undefined}
          />
        ),
      },
      {
        key: COLUMN_KEYS.REJECT_REASON,
        title: t("Reject Reason"),
        className: "min-w-[220px]",
        render: (_, record) => (
          <RichTextContent
            value={record.reject_reason?.trim() ?? ""}
            className="text-sm text-foreground whitespace-pre-wrap break-words !font-display-1"
            maxLines={2}
            showMoreLabel={t("See more")}
            showLessLabel={t("See less")}
            emptyFallback={<span className="text-foreground-secondary">—</span>}
          />
        ),
      },
      {
        key: COLUMN_KEYS.ACTION,
        title: t("Action"),
        className: "min-w-[160px]",
        sticky: "right",
        render: (_, record) => (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <PreviewUserPopover
              user={record}
              theme={isDark ? "dark" : "light"}
              trigger={
                <button
                  type="button"
                  title={t("See more")}
                  className={cn(
                    "rounded-md border px-1.5 py-1.5 text-xs font-medium transition-colors cursor-pointer duration-200",
                    isDark
                      ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-blue-300"
                      : "border-zinc-300 text-zinc-700 hover:bg-zinc-100 hover:text-blue-700",
                  )}
                >
                  <TbScanEye className="size-5" />
                </button>
              }
            />
            {record.status === STATUS.ACTIVE ? (
              <BanUserConfirm
                userId={record.id}
                userName={record.name}
                theme={isDark ? "dark" : "light"}
              />
            ) : null}
          </div>
        ),
      },
    ],
    [isDark, pagination.current, pagination.pageSize, t],
  );

  return (
    <SharedDataTable
      columns={columns}
      data={users}
      loading={loading}
      rowKey="id"
      emptyTitle={t("No users found")}
      emptyDescription={t("No users available for the current filters.")}
      pagination={{
        page: pagination.current,
        pageSize: pagination.pageSize,
        total,
        onPageChange,
        onPageSizeChange,
      }}
    />
  );
}
