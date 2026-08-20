import { memo, type ReactNode, useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { IAdminUser } from "@/apis/user/models/getUsers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StatusTag } from "@/components/ui/StatusTag";
import { RichTextContent } from "@/components/ui/RichTextContent";
import Image from "@/components/ui/AppImage";
import defaultAvatar from "@/public/default-avatar.png";
import { STATUS } from "@/constants/status";
import { cn } from "@/libs/utils";
import { formattedDate } from "@/utils/formattedDate";
import { TbCircleCheck, TbCircleX } from "react-icons/tb";

export type PreviewUserPopoverProps = {
  user: IAdminUser;
  theme?: "light" | "dark";
  trigger: ReactNode;
};

type DetailRow = {
  key: string;
  label: string;
  value: ReactNode;
  /** Short fields sit in a 2-col grid; long fields span full width as a column. */
  layout: "short" | "long";
};

function emptyFallback(isDark: boolean) {
  return (
    <span className={cn(isDark ? "text-zinc-500" : "text-zinc-400")}>—</span>
  );
}

export const PreviewUserPopover = memo(function PreviewUserPopover({
  user,
  theme = "dark",
  trigger,
}: PreviewUserPopoverProps) {
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const genderLabel = useMemo(() => {
    if (!user.gender) return null;
    const map: Record<string, string> = {
      male: t("Male"),
      female: t("Female"),
      other: t("Other"),
      prefer_not_to_say: t("Prefer not to say"),
    };
    return map[user.gender] ?? user.gender;
  }, [t, user.gender]);

  const notificationRows = useMemo(() => {
    const prefs = user.notification_preferences ?? {};
    const entries = Object.entries(prefs);
    if (entries.length === 0) return null;
    return (
      <ul className="space-y-1">
        {entries.map(([key, enabled]) => (
          <li
            key={key}
            className={cn(
              "flex items-center justify-between gap-3 text-sm",
              isDark ? "text-zinc-300" : "text-zinc-700",
            )}
          >
            <span className="truncate font-mono text-xs">{key}</span>
            <span
              className={cn(
                "shrink-0 text-xs font-medium",
                enabled ? "text-emerald-500" : isDark ? "text-zinc-500" : "text-zinc-400",
              )}
            >
              {enabled ? t("On") : t("Off")}
            </span>
          </li>
        ))}
      </ul>
    );
  }, [isDark, t, user.notification_preferences]);

  const rows: DetailRow[] = useMemo(
    () => [
      // {
      //   key: "id",
      //   label: t("ID"),
      //   layout: "long",
      //   value: (
      //     <span className="break-all font-mono text-xs">{user.id}</span>
      //   ),
      // },
      {
        key: "name",
        label: t("Name"),
        layout: "short",
        value: user.name || emptyFallback(isDark),
      },
      {
        key: "email",
        label: t("Email"),
        layout: "short",
        value: user.email || emptyFallback(isDark),
      },
      {
        key: "email_verified",
        label: t("Email verified"),
        layout: "short",
        value: (
          <span className="inline-flex items-center gap-1.5">
            {user.email_verified ? (
              <>
                <TbCircleCheck className="size-4 text-emerald-500" />
                {t("Verified")}
              </>
            ) : (
              <>
                <TbCircleX className="size-4 text-red-500" />
                {t("Unverified")}
              </>
            )}
          </span>
        ),
      },
      {
        key: "role",
        label: t("Role"),
        layout: "short",
        value: user.role_name ? (
          <span className="capitalize">{user.role_name}</span>
        ) : (
          emptyFallback(isDark)
        ),
      },
      // {
      //   key: "role_id",
      //   label: t("Role ID"),
      //   layout: "long",
      //   value: (
      //     <span className="break-all font-mono text-xs">{user.role_id}</span>
      //   ),
      // },
      {
        key: "status",
        label: t("Status"),
        layout: "short",
        value: (
          <StatusTag
            status={user.status}
            className="!mx-0 min-w-0 justify-center"
            label={user.status === STATUS.INACTIVE ? t("Banned") : undefined}
          />
        ),
      },
      {
        key: "phone",
        label: t("Phone number"),
        layout: "short",
        value: user.phone_number?.trim() || emptyFallback(isDark),
      },
      {
        key: "gender",
        label: t("Gender"),
        layout: "short",
        value: genderLabel || emptyFallback(isDark),
      },
      {
        key: "date_of_birth",
        label: t("Date of birth"),
        layout: "short",
        value: user.date_of_birth
          ? formattedDate(user.date_of_birth)
          : emptyFallback(isDark),
      },
      // {
      //   key: "reject_reason",
      //   label: t("Reject Reason"),
      //   layout: "long",
      //   value: user.reject_reason?.trim() ? (
      //     <RichTextContent
      //       value={user.reject_reason}
      //       className="text-sm whitespace-pre-wrap break-words !font-display-1"
      //       maxLines={6}
      //       showMoreLabel={t("See more")}
      //       showLessLabel={t("See less")}
      //     />
      //   ) : (
      //     emptyFallback(isDark)
      //   ),
      // },
      {
        key: "bio",
        label: t("Bio"),
        layout: "long",
        value: user.bio?.trim() ? (
          <RichTextContent
            value={user.bio}
            className="text-sm whitespace-pre-wrap break-words !font-display-1"
            maxLines={6}
            showMoreLabel={t("See more")}
            showLessLabel={t("See less")}
          />
        ) : (
          emptyFallback(isDark)
        ),
      },
      {
        key: "detail_address",
        label: t("Detail address"),
        layout: "long",
        value:
          user.detail_address?.trim() || user.location_updated_at ? (
            <div className="flex flex-col gap-1">
              <span>
                {user.detail_address?.trim() || emptyFallback(isDark)}
              </span>
              {user.location_updated_at ? (
                <span
                  className={cn(
                    "text-xs",
                    isDark ? "text-zinc-500" : "text-zinc-400",
                  )}
                >
                  {t("Location updated")}:{" "}
                  {formattedDate(user.location_updated_at)}
                </span>
              ) : null}
            </div>
          ) : (
            emptyFallback(isDark)
          ),
      },
      {
        key: "created_at",
        label: t("Created"),
        layout: "short",
        value: user.created_at
          ? formattedDate(user.created_at)
          : emptyFallback(isDark),
      },
      {
        key: "updated_at",
        label: t("Updated"),
        layout: "short",
        value: user.updated_at
          ? formattedDate(user.updated_at)
          : emptyFallback(isDark),
      },
      {
        key: "notification_preferences",
        label: t("Notification preferences"),
        layout: "long",
        value: notificationRows ?? emptyFallback(isDark),
      },
    ],
    [genderLabel, isDark, notificationRows, t, user],
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className={cn(
          "flex max-h-[min(90vh,900px)] w-full max-w-[min(100vw-2rem,640px)] flex-col gap-0 overflow-hidden border-none p-0",
          isDark ? "bg-zinc-900" : "bg-white/95 backdrop-blur-md",
        )}
        showCloseButton
      >
        <DialogHeader
          className={cn(
            "shrink-0 border-b px-4 py-3 sm:px-6",
            isDark ? "border-zinc-700" : "border-zinc-200",
          )}
        >
          <DialogTitle
            className={cn(
              "text-left text-base font-semibold",
              isDark ? "text-zinc-100" : "text-zinc-900",
            )}
          >
            {t("Preview")}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
          <div className="mb-5 flex items-center gap-3">
            <Image
              src={user.avatar || defaultAvatar}
              alt={user.name}
              width={56}
              height={56}
              className={cn(
                "h-14 w-14 shrink-0 rounded-full object-cover ring-1",
                isDark ? "ring-zinc-700" : "ring-zinc-200",
              )}
            />
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate text-lg font-semibold",
                  isDark ? "text-zinc-100" : "text-zinc-900",
                )}
              >
                {user.name}
              </p>
              <p
                className={cn(
                  "truncate text-sm",
                  isDark ? "text-zinc-400" : "text-zinc-600",
                )}
              >
                {user.email}
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <div
                key={row.key}
                className={cn(
                  "flex flex-col gap-1 rounded-lg border px-3 py-2.5",
                  isDark ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-200 bg-zinc-50/80",
                  row.layout === "long" && "sm:col-span-2",
                )}
              >
                <dt
                  className={cn(
                    "text-xs font-medium",
                    isDark ? "text-zinc-400" : "text-zinc-500",
                  )}
                >
                  {row.label}
                </dt>
                <dd
                  className={cn(
                    "text-sm break-words",
                    isDark ? "text-zinc-100" : "text-zinc-900",
                  )}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default PreviewUserPopover;
