import { memo, useEffect } from "react";
import { useFormState, useWatch } from "react-hook-form";
import dynamic from "@/libs/dynamic";
import { useTranslation } from "react-i18next";
import { AddressSearchField } from "@/components/form/AddressSearchField";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/client/shared/Button";
import { DETAIL_ADDRESS_MAX_LENGTH } from "@/constants/address";
import { cn } from "@/libs/utils";
import { useCampaign } from "../_context/CampaignContext";
import { useAddressPicker } from "../_hooks/useAddressPicker";
import type { CampaignFormValues } from "../_services/campaignForm.service";

const AddressMap = dynamic(() => import("@/modules/AddressMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-xl bg-slate-100 animate-pulse" />
  ),
});

/** Location picker for one meeting point (`meeting_points.<index>`). */
const MeetingPointAddress = memo(function MeetingPointAddress({
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
              <AddressSearchField
                value={searchQuery}
                onChange={changeSearchQuery}
                onPick={(suggestion) => {
                  changeSearchQuery(suggestion.description);
                  void handleSearch(suggestion);
                }}
                loading={isSearching}
                warning={!!forwardWarning}
                maxLength={DETAIL_ADDRESS_MAX_LENGTH}
                near={position}
              />
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
        <AddressMap
          position={position}
          setPosition={handleMapPosition}
          popupText={detailAddress || t("Selected location")}
        />
      </div>
    </div>
  );
});

export default MeetingPointAddress;
