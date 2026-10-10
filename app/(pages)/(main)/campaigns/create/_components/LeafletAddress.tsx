import { memo, useEffect } from "react";
import { useFormState, useWatch } from "react-hook-form";
import dynamic from "@/libs/dynamic";
import { useTranslation } from "react-i18next";
import { IoIosSearch } from "react-icons/io";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/client/shared/Button";
import { DETAIL_ADDRESS_MAX_LENGTH } from "@/constants/address";
import { cn } from "@/libs/utils";
import { useCampaign } from "../_context/CampaignContext";
import { useAddressPicker } from "../_hooks/useAddressPicker";
import type { CampaignFormValues } from "../_services/campaignForm.service";

const LeafletAddressMap = dynamic(() => import("@/modules/LeafletAddressMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl bg-slate-100 animate-pulse" />
  ),
});

/** Location picker for one meeting point (`meeting_points.<index>`). */
const LeafletAddress = memo(function LeafletAddress({
  index,
  title,
}: {
  index: number;
  title?: string;
}) {
  const { t } = useTranslation();
  const { form } = useCampaign();
  const { register, control } = form;
  const ADDRESS = `meeting_points.${index}.detail_address` as const;
  const detailAddress = useWatch({ control, name: ADDRESS });
  const { errors } = useFormState<CampaignFormValues>({
    control,
    name: [ADDRESS],
  });
  const addressError = errors.meeting_points?.[index]?.detail_address;

  // Registered before the picker hook so its effects run after, as before.
  useEffect(() => {
    register(ADDRESS, {
      maxLength: {
        value: DETAIL_ADDRESS_MAX_LENGTH,
        message: t("Detail address must be at most {{max}} characters", {
          max: DETAIL_ADDRESS_MAX_LENGTH,
        }),
      },
    });
  }, [ADDRESS, register, t]);

  const {
    position,
    forwardWarning,
    isEditing,
    canConfirm,
    isSearching,
    searchQuery,
    changeSearchQuery,
    useCurrentLocation,
    startEditing,
    handleSearch,
    handleConfirm,
    handleCancel,
    handleMapPosition,
  } = useAddressPicker(index);

  return (
    <div className="w-full h-full flex flex-col gap-[24px]">
      <span className="font-display-5 font-semibold !text-button-accent ">
        {title ?? t("Location")}
      </span>

      <Field className="w-full gap-2">
        <FieldLabel className="text-foreground-tertiary font-display-3">
          {t("Detail address")}
        </FieldLabel>

        {!isEditing ? (
          <>
            <p
              className={cn(
                "min-h-16 rounded-md border border-[rgba(136,122,71,0.5)] bg-muted/40 px-2.5 py-2 text-sm leading-relaxed",
                detailAddress ? "text-foreground" : "text-foreground-tertiary",
              )}
            >
              {detailAddress || t("Street, district, city...")}
            </p>
            <FieldError errors={[addressError]} />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outlined-brown"
                className="w-fit"
                onClick={useCurrentLocation}
              >
                {t("Use current location")}
              </Button>
              <Button type="button" variant="outlined-brown" className="w-fit" onClick={startEditing}>
                {t("Edit")}
              </Button>
            </div>
          </>
        ) : (
          <>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSearch();
              }}
              className="w-full"
            >
              <div
                className={cn(
                  "flex h-[50px] w-full overflow-hidden rounded-md border border-[rgba(136,122,71,0.5)]",
                  "focus-within:border-ring focus-within:ring-3 focus-within:ring-[rgba(136,122,71,0.5)]/50",
                  forwardWarning && "border-amber-600",
                )}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => changeSearchQuery(event.target.value)}
                  maxLength={DETAIL_ADDRESS_MAX_LENGTH}
                  placeholder={t("Search...")}
                  disabled={isSearching}
                  className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-foreground-tertiary disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  aria-label={t("Search")}
                  className="flex h-full w-[50px] shrink-0 items-center justify-center border-l border-[rgba(136,122,71,0.5)] bg-button-accent text-white transition-colors hover:bg-button-accent-hover disabled:opacity-60"
                >
                  {isSearching ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <IoIosSearch size={20} />
                  )}
                </button>
              </div>
            </form>
            {forwardWarning && (
              <p role="status" className="text-sm font-normal text-amber-700">
                {forwardWarning}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="brown"
                isDisabled={!canConfirm || isSearching}
                onClick={handleConfirm}
              >
                {t("Confirm")}
              </Button>
              <Button type="button" variant="outlined-brown" onClick={handleCancel}>
                {t("Cancel")}
              </Button>
            </div>
          </>
        )}
      </Field>

      <div className="relative z-0 w-full h-[380px] rounded-xl overflow-hidden border border-[rgba(136,122,71,0.5)]">
        <LeafletAddressMap
          position={position}
          setPosition={handleMapPosition}
          popupText={detailAddress || t("Selected location")}
        />
      </div>
    </div>
  );
});

export default LeafletAddress;
