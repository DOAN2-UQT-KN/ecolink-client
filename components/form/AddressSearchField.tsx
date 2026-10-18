import { memo, useId, useState, type KeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { IoIosSearch } from "react-icons/io";
import { useDebounce } from "@/hooks/useDebounce";
import { autocompleteAddress, normalizeAddressQuery, type AddressSuggestion, type LatLng } from "@/libs/geocoding";
import { cn } from "@/libs/utils";

const MIN_CHARS = 3;
const DEBOUNCE_MS = 400;

/**
 * Address search box of the location pickers: suggestions while typing (Goong Place AutoComplete),
 * and the existing "search" submit of the enclosing <form> for Enter / the button. Picking a
 * suggestion hands it to `onPick`, which resolves its coordinates like a successful search.
 * Every pause in typing costs one Goong REST call, hence 3 characters, focus only and caching.
 */
export const AddressSearchField = memo(function AddressSearchField({
  value,
  onChange,
  onPick,
  loading,
  disabled,
  warning,
  maxLength,
  near,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: (suggestion: AddressSuggestion) => void;
  loading: boolean;
  disabled?: boolean;
  warning?: boolean;
  maxLength?: number;
  near?: LatLng | null;
}) {
  const { t } = useTranslation();
  const listId = useId();
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [picked, setPicked] = useState<string | null>(null);

  const q = useDebounce(value, DEBOUNCE_MS).trim();
  const bias = near ? { lat: Number(near.lat.toFixed(3)), lng: Number(near.lng.toFixed(3)) } : null;
  const enabled = focused && !disabled && q.length >= MIN_CHARS && normalizeAddressQuery(q) !== picked;
  const { data: suggestions = [] } = useQuery({
    queryKey: ["goong", "autocomplete", normalizeAddressQuery(q), bias?.lat, bias?.lng],
    queryFn: () => autocompleteAddress(q, bias),
    enabled,
    staleTime: 30 * 60_000,
    retry: false,
  });
  const visible = open && enabled && suggestions.length > 0;

  const pick = (s: AddressSuggestion) => {
    setPicked(normalizeAddressQuery(s.description));
    setOpen(false);
    setActive(-1);
    onPick(s);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!visible) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const n = suggestions.length;
      setActive((i) => (e.key === "ArrowDown" ? (i + 1) % n : (i <= 0 ? n : i) - 1));
    } else if (e.key === "Enter" && active >= 0 && active < suggestions.length) {
      e.preventDefault(); // pick instead of submitting the plain search
      pick(suggestions[active]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className="relative w-full">
      <div
        className={cn(
          "flex h-[50px] w-full overflow-hidden rounded-md border border-[rgba(136,122,71,0.5)]",
          "focus-within:border-ring focus-within:ring-3 focus-within:ring-[rgba(136,122,71,0.5)]/50",
          warning && "border-amber-600",
        )}
      >
        <input
          type="text"
          role="combobox"
          aria-expanded={visible}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setPicked(null);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setFocused(false);
            setOpen(false);
          }}
          onKeyDown={onKeyDown}
          maxLength={maxLength}
          placeholder={t("Search...")}
          disabled={disabled || loading}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-foreground-tertiary disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || loading}
          aria-label={t("Search")}
          className="flex h-full w-[50px] shrink-0 items-center justify-center border-l border-[rgba(136,122,71,0.5)] bg-button-accent text-white transition-colors hover:bg-button-accent-hover disabled:opacity-60"
        >
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <IoIosSearch size={20} />
          )}
        </button>
      </div>
      {visible && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("Address suggestions")}
          className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-[rgba(136,122,71,0.35)] bg-white shadow-lg"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()} // keep focus so blur does not close before the click
              onMouseEnter={() => setActive(i)}
              onClick={() => pick(s)}
              className={cn(
                "flex cursor-pointer flex-col px-3 py-2 text-left",
                i === active ? "bg-[rgba(136,122,71,0.12)]" : "hover:bg-[rgba(136,122,71,0.08)]",
              )}
            >
              <span className="truncate text-sm font-medium text-foreground-primary">{s.mainText}</span>
              {s.secondaryText && <span className="truncate text-xs text-foreground-tertiary">{s.secondaryText}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

export default AddressSearchField;
