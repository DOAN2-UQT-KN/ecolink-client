import dynamic from "@/libs/dynamic"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    getAddressFromLatLng,
    reverseCacheKey,
    type LatLng,
    type ReverseGeocodingAddress,
} from "@/libs/geocoding"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/libs/utils"
import { useTranslation } from "react-i18next"

const AddressMap = dynamic(() => import("@/modules/AddressMap"), {
    ssr: false,
    loading: () => (
        <div className="h-[220px] w-full animate-pulse rounded-xl bg-slate-100" />
    ),
})

type Props = {
    disabled?: boolean
    onSubmit: (payload: {
        detailAddress: string
        latitude?: number
        longitude?: number
    }) => void
}

const AddressPickerCard = memo(function AddressPickerCard({ disabled, onSubmit }: Props) {
    const { t } = useTranslation()
    const [position, setPosition] = useState<LatLng | null>(null)
    const [detailAddress, setDetailAddress] = useState("")
    const [loadingAddr, setLoadingAddr] = useState(false)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const cacheRef = useRef<Map<string, ReverseGeocodingAddress>>(new Map())

    useEffect(() => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            },
            () => {
                /* ignore */
            }
        )
    }, [])

    useEffect(() => {
        if (!position) return
        const key = reverseCacheKey(position.lat, position.lng)
        const cached = cacheRef.current.get(key)
        if (cached?.detailAddress) {
            setDetailAddress((prev) => prev || cached.detailAddress || "")
            return
        }
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setLoadingAddr(true)
            try {
                const parsed = await getAddressFromLatLng(position.lat, position.lng)
                cacheRef.current.set(key, parsed)
                if (parsed.detailAddress) {
                    setDetailAddress((prev) => prev || parsed.detailAddress || "")
                }
            } catch {
                // Lookup failed: keep whatever the user typed.
            } finally {
                setLoadingAddr(false)
            }
        }, 400)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [position])

    const canSubmit = useMemo(() => !!detailAddress.trim(), [detailAddress])

    const submit = useCallback(() => {
        const addr = detailAddress.trim()
        if (!addr) return
        onSubmit({
            detailAddress: addr,
            latitude: position?.lat,
            longitude: position?.lng,
        })
    }, [detailAddress, onSubmit, position?.lat, position?.lng])

    return (
        <div className="mt-2 w-full rounded-xl border border-border bg-background/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-foreground">
                    {t("Pick location & submit Detail Address")}
                </p>
                {loadingAddr ? (
                    <span className="text-xs text-muted-foreground">{t("Looking up…")}</span>
                ) : null}
            </div>

            <div className="mb-2 h-[220px] w-full overflow-hidden rounded-xl border border-border">
                <AddressMap
                    position={position}
                    setPosition={setPosition}
                    popupText={detailAddress || t("Selected location")}
                />
            </div>

            <Textarea
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                placeholder={t("Detail address (street, ward/district, city)…")}
                className={cn("min-h-[88px] text-sm", disabled && "opacity-60")}
                disabled={disabled}
            />

            <div className="mt-2 flex justify-end">
                <Button
                    type="button"
                    size="sm"
                    className="bg-[#6d7b36] hover:bg-[#5c6a2d]"
                    disabled={disabled || !canSubmit}
                    onClick={submit}
                >
                    {t("Submit address")}
                </Button>
            </div>
        </div>
    )
})

export default AddressPickerCard

