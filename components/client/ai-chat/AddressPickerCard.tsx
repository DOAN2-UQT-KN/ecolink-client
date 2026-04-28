"use client"

import dynamic from "next/dynamic"
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { LatLngLiteral } from "leaflet"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { cn } from "@/libs/utils"

const LeafletAddressMap = dynamic(() => import("@/modules/LeafletAddressMap"), {
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

type ReverseGeocodingAddress = {
    detailAddress?: string
}

function parseReverseGeocode(data: {
    display_name?: string
    address?: Record<string, string | undefined>
}): ReverseGeocodingAddress {
    const address = data.address ?? {}
    const parsedCity =
        address.city ??
        address.town ??
        address.state ??
        address.province ??
        address.municipality
    const parsedDistrict =
        address.county ??
        address.city_district ??
        address.district ??
        address.suburb ??
        address.quarter
    const parsedDetail =
        data.display_name ??
        [address.road, address.house_number, parsedDistrict, parsedCity]
            .filter(Boolean)
            .join(", ")
    return { detailAddress: parsedDetail }
}

async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodingAddress> {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { Accept: "application/json" } }
    )
    if (!response.ok) return {}
    const data = (await response.json()) as {
        display_name?: string
        address?: Record<string, string | undefined>
    }
    return parseReverseGeocode(data)
}

const AddressPickerCard = memo(function AddressPickerCard({ disabled, onSubmit }: Props) {
    const [position, setPosition] = useState<LatLngLiteral | null>(null)
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
        const key = `${position.lat.toFixed(4)},${position.lng.toFixed(4)}`
        const cached = cacheRef.current.get(key)
        if (cached?.detailAddress) {
            setDetailAddress((prev) => prev || cached.detailAddress || "")
            return
        }
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(async () => {
            setLoadingAddr(true)
            try {
                const parsed = await reverseGeocode(position.lat, position.lng)
                cacheRef.current.set(key, parsed)
                if (parsed.detailAddress) {
                    setDetailAddress((prev) => prev || parsed.detailAddress || "")
                }
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
                    Pick location & submit Detail Address
                </p>
                {loadingAddr ? (
                    <span className="text-xs text-muted-foreground">Looking up…</span>
                ) : null}
            </div>

            <div className="mb-2 h-[220px] w-full overflow-hidden rounded-xl border border-border">
                <LeafletAddressMap
                    position={position}
                    setPosition={setPosition}
                    popupText={detailAddress || "Selected location"}
                />
            </div>

            <Textarea
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                placeholder="Detail address (street, ward/district, city)…"
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
                    Submit address
                </Button>
            </div>
        </div>
    )
})

export default AddressPickerCard

