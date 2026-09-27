import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbCheck, TbZoom } from "react-icons/tb";

import { useSearchOrganizationUsers } from "@/apis/organization/memberManagement";
import type { IUserSearchResult } from "@/apis/organization/models/membership";
import Image from "@/components/ui/AppImage";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/libs/utils";
import defaultAvatar from "@/public/default-avatar.png";

/**
 * Picks one existing Ecolink user to invite into an organization. Only people with an
 * account can be picked; emails come back masked. People who already belong to the
 * organization are shown but cannot be picked.
 */
export const SelectListUser = memo(function SelectListUser({
  organizationId,
  value,
  onChange,
}: {
  organizationId: string;
  value: IUserSearchResult | null;
  onChange: (user: IUserSearchResult | null) => void;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 300);
  const { data, isFetching } = useSearchOrganizationUsers(
    organizationId,
    debounced.trim(),
  );
  const users = data?.data?.users ?? [];
  const tooShort = debounced.trim().length < 2;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <TbZoom className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("Search by name or email")}
          className="pl-9"
          autoFocus
        />
      </div>
      <div className="max-h-64 overflow-y-auto rounded-md border border-[rgba(136,122,71,0.35)]">
        {tooShort ? (
          <p className="p-3 text-sm text-foreground-tertiary">
            {t("Type at least 2 characters")}
          </p>
        ) : isFetching && users.length === 0 ? (
          <p className="p-3 text-sm text-foreground-tertiary">{t("Searching...")}</p>
        ) : users.length === 0 ? (
          <p className="p-3 text-sm text-foreground-tertiary">
            {t("No one found. Only people with an Ecolink account can be invited.")}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {users.map((user) => {
              const selected = value?.id === user.id;
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    disabled={user.is_member}
                    onClick={() => onChange(selected ? null : user)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer",
                      "hover:bg-[rgba(136,122,71,0.08)] disabled:cursor-not-allowed disabled:opacity-60",
                      selected && "bg-[rgba(136,122,71,0.12)]",
                    )}
                  >
                    <Image
                      src={user.avatar || defaultAvatar}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{user.name}</span>
                      <span className="truncate text-xs text-foreground-tertiary">
                        {user.email}
                      </span>
                    </span>
                    {user.is_member ? (
                      <RoleBadge role={user.role} />
                    ) : selected ? (
                      <TbCheck className="size-5 text-button-accent" />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
});

export default SelectListUser;

