import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbUserPlus, TbX } from "react-icons/tb";

import { useSearchOrganizationUsers } from "@/apis/organization/memberManagement";
import Image from "@/components/ui/AppImage";
import { Input } from "@/components/ui/input";
import { RoleBadge } from "@/components/ui/RoleBadge";
import { useDebounce } from "@/hooks/useDebounce";
import defaultAvatar from "@/public/default-avatar.png";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface AutoCompleteUserValue {
  /** Set when an existing account was picked. */
  userId?: string;
  email: string;
  name?: string;
}

/**
 * Picks a person for an owner proposal: an existing account from the suggestions (full email
 * shown to owners), or — when nobody matches — the typed email of someone without an
 * account yet. That account is only created if the proposal is approved.
 */
export const AutoCompleteUser = memo(function AutoCompleteUser({
  organizationId,
  value,
  onChange,
  invalid,
}: {
  organizationId: string;
  value: AutoCompleteUserValue | null;
  onChange: (value: AutoCompleteUserValue | null) => void;
  invalid?: boolean;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(q, 300).trim();
  const { data } = useSearchOrganizationUsers(organizationId, debounced);
  const users = data?.data?.users ?? [];
  const typedEmail = EMAIL_PATTERN.test(debounced) ? debounced.toLowerCase() : null;
  const exactMatch = users.some((u) => u.email.toLowerCase() === typedEmail);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-[rgba(136,122,71,0.5)] px-3 py-2">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">
            {value.name || value.email}
          </span>
          <span className="truncate text-xs text-foreground-tertiary">
            {value.email}
            {!value.userId && ` · ${t("No account yet")}`}
          </span>
        </span>
        <button
          type="button"
          aria-label={t("Remove")}
          onClick={() => onChange(null)}
          className="rounded-full p-1 text-foreground-tertiary hover:bg-[rgba(136,122,71,0.1)] cursor-pointer"
        >
          <TbX className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder={t("Search by name or email")}
        aria-invalid={invalid}
      />
      {open && debounced.length >= 2 && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-[rgba(136,122,71,0.35)] bg-white shadow-lg">
          {users.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                disabled={user.role === "OWNER" || user.role === "LEGAL_REPRESENTATIVE"}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange({ userId: user.id, email: user.email, name: user.name });
                  setQ("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-[rgba(136,122,71,0.08)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <Image
                  src={user.avatar || defaultAvatar}
                  alt={user.name}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  <span className="truncate text-xs text-foreground-tertiary">
                    {user.email}
                  </span>
                </span>
                {user.is_member && <RoleBadge role={user.role} />}
              </button>
            </li>
          ))}
          {typedEmail && !exactMatch && (
            <li>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange({ email: typedEmail });
                  setQ("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[rgba(136,122,71,0.08)] cursor-pointer"
              >
                <TbUserPlus className="size-5 text-button-accent" />
                {t("Use {{email}} (no account yet)", { email: typedEmail })}
              </button>
            </li>
          )}
          {users.length === 0 && !typedEmail && (
            <li className="px-3 py-2 text-sm text-foreground-tertiary">
              {t("No one found. Type a full email to propose someone without an account.")}
            </li>
          )}
        </ul>
      )}
    </div>
  );
});

export default AutoCompleteUser;
