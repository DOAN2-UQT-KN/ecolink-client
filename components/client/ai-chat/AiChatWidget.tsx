"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import useAuthStore from "@/stores/useAuthStore"
import { cn } from "@/libs/utils"
import { ImagePlus, MessageCircle, Plus, SendHorizontal, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import AssistantMarkdown from "./AssistantMarkdown"
import AddressPickerCard from "./AddressPickerCard"
import {
    createConversation,
    DEFAULT_AGENT_ID,
    isChatApiConfigured,
    listMessages,
    streamAssistantReply,
    type ChatMessageDto,
} from "./aiChatClient"
import { stripThinkingDisplay } from "./thinkingDisplay"
import {
    formatAppendTextForMediaIds,
    parseMediaIdsFromAppendText,
    parseUserMessageMediaIds,
} from "./userMessageMedia"
import { registerChatMedia } from "@/apis/chat-media/registerChatMedia"
import { uploadToCloudinary } from "@/app/(pages)/(main)/incidents/create/_services/upload.service"
import { compressImage } from "@/libs/compressImage"
import { usePathname } from "next/navigation"

const MAX_CHAT_IMAGES = 8

type PendingImage = {
    id: string
    blob: Blob
    previewUrl: string
    name: string
}

type UiMessage = {
    id: string
    role: "user" | "assistant"
    content: string
    streaming?: boolean
    toolsUsed?: string[]
    mediaIds?: string[]
    /** Agent-only (e.g. media_ids block); mirrors API `append_text` */
    append_text?: string
    /** Hosted image URLs (shown after send / reload may omit) */
    imageUrls?: string[]
}

const HIDDEN_MESSAGE_MARKER = "[[HIDDEN_message]]"
const PICK_ADDRESS_MARKER = "[[PICK_ADDRESS]]"

function stripPickAddressAndUrlsForDisplay(text: string): string {
    const hasPick = text.includes(PICK_ADDRESS_MARKER)
    if (!hasPick) return text

    // Remove the marker line completely.
    const withoutMarker = text
        .split("\n")
        .filter((line) => line.trim() !== PICK_ADDRESS_MARKER)
        .join("\n")

    // For this flow, don't show raw URLs (e.g. Cloudinary image links).
    // Keep it simple and polite; the UI already shows the address picker.
    return withoutMarker.replace(
        /https?:\/\/[^\s)]+/g,
        ""
    )
}

function dtoToUi(m: ChatMessageDto): UiMessage | null {
    if (m.role !== "user" && m.role !== "assistant") return null
    const raw = m.content ?? ""
    if (m.role === "assistant") {
        return {
            id: m.id,
            role: m.role,
            content: stripThinkingDisplay(raw),
        }
    }
    if (raw.trimStart().startsWith(HIDDEN_MESSAGE_MARKER)) {
        // Hide user messages that are meant to be tool/UX glue (e.g. address submit).
        return null
    }
    const append = m.append_text ?? ""
    let mediaIds = parseMediaIdsFromAppendText(append)
    let displayBody = raw
    if (!mediaIds.length) {
        const legacy = parseUserMessageMediaIds(raw)
        if (legacy.mediaIds.length) {
            mediaIds = legacy.mediaIds
            displayBody = legacy.body
        }
    }
    return {
        id: m.id,
        role: m.role,
        content: displayBody,
        append_text: append || undefined,
        mediaIds: mediaIds.length ? mediaIds : undefined,
    }
}

function storageKey(userId: string) {
    return `ecolink_ai_chat_conversation:${userId}`
}

export default function AiChatWidget() {
    const pathname = usePathname()
    const accessToken = useAuthStore((s) => s.accessToken)
    const user = useAuthStore((s) => s.user)
    const hasHydrated = useAuthStore((s) => s.has_hydrated)

    const [open, setOpen] = useState(false)
    const [messages, setMessages] = useState<UiMessage[]>([])
    const [input, setInput] = useState("")
    const [conversationId, setConversationId] = useState<string | null>(null)
    const [booting, setBooting] = useState(false)
    const [streaming, setStreaming] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const scrollRef = useRef<HTMLDivElement>(null)
    const abortRef = useRef<AbortController | null>(null)
    const conversationIdRef = useRef<string | null>(null)
    conversationIdRef.current = conversationId

    const baseConfigured =
        typeof window !== "undefined" && isChatApiConfigured()
    const userId = user?.id ?? ""

    useEffect(() => {
        // Session is carried by access token + user id; `is_authenticated` may lag until rehydrate.
        if (!hasHydrated || !accessToken || !userId) {
            setConversationId(null)
            return
        }
        try {
            const stored = sessionStorage.getItem(storageKey(userId))
            if (stored) setConversationId(stored)
        } catch {
            /* ignore */
        }
    }, [hasHydrated, accessToken, userId])

    useEffect(() => {
        if (!open || !conversationId || !accessToken || !baseConfigured) return
        let cancelled = false
        ;(async () => {
            const loadId = conversationId
            setBooting(true)
            try {
                const rows = await listMessages(loadId)
                if (cancelled || conversationIdRef.current !== loadId) return
                const ui = rows.map(dtoToUi).filter(Boolean) as UiMessage[]
                setMessages(ui)
            } catch (e) {
                if (cancelled || conversationIdRef.current !== loadId) return
                const msg = e instanceof Error ? e.message : "Failed to load chat"
                toast.error(msg)
                setConversationId(null)
                try {
                    sessionStorage.removeItem(storageKey(userId))
                } catch {
                    /* ignore */
                }
            } finally {
                if (!cancelled && conversationIdRef.current === loadId) {
                    setBooting(false)
                }
            }
        })()
        return () => {
            cancelled = true
        }
    }, [open, conversationId, accessToken, userId, baseConfigured])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        el.scrollTop = el.scrollHeight
    }, [messages, open])

    const persistConversationId = useCallback(
        (id: string | null) => {
            setConversationId(id)
            if (!userId) return
            try {
                if (id) sessionStorage.setItem(storageKey(userId), id)
                else sessionStorage.removeItem(storageKey(userId))
            } catch {
                /* ignore */
            }
        },
        [userId]
    )

    const onPickFiles = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files
            if (!files?.length) return
            const slots = MAX_CHAT_IMAGES - pendingImages.length
            if (slots <= 0) {
                toast.error(`You can attach at most ${MAX_CHAT_IMAGES} images.`)
                e.target.value = ""
                return
            }
            const arr = Array.from(files).slice(0, slots)
            try {
                const newItems: PendingImage[] = []
                for (const file of arr) {
                    if (!file.type.startsWith("image/")) continue
                    const blob = await compressImage(file)
                    const previewUrl = URL.createObjectURL(blob)
                    newItems.push({
                        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        blob,
                        previewUrl,
                        name: file.name,
                    })
                }
                if (newItems.length) {
                    setPendingImages((prev) => [...prev, ...newItems])
                }
            } catch {
                toast.error("Could not process an image.")
            } finally {
                e.target.value = ""
            }
        },
        [pendingImages.length]
    )

    const removePendingImage = useCallback((id: string) => {
        setPendingImages((prev) => {
            const found = prev.find((p) => p.id === id)
            if (found) URL.revokeObjectURL(found.previewUrl)
            return prev.filter((p) => p.id !== id)
        })
    }, [])

    const handleNewChat = useCallback(async () => {
        if (!accessToken) {
            toast.error("Sign in to use the assistant.")
            return
        }
        if (!baseConfigured) {
            toast.error("API URL is not configured (NEXT_PUBLIC_API_URL).")
            return
        }
        abortRef.current?.abort()
        abortRef.current = null
        setPendingImages((prev) => {
            prev.forEach((p) => URL.revokeObjectURL(p.previewUrl))
            return []
        })
        setBooting(true)
        setMessages([])
        try {
            const conv = await createConversation({
                agentId: DEFAULT_AGENT_ID,
            })
            persistConversationId(conv.id)
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Could not start a new chat"
            toast.error(msg)
            persistConversationId(null)
        } finally {
            setBooting(false)
        }
    }, [accessToken, baseConfigured, persistConversationId])

    const handleSend = useCallback(async () => {
        const text = input.trim()
        if ((!text && pendingImages.length === 0) || streaming || isUploading || !accessToken)
            return
        if (!baseConfigured) {
            toast.error("API URL is not configured (NEXT_PUBLIC_API_URL).")
            return
        }

        let convId = conversationId
        if (!convId) {
            setBooting(true)
            try {
                const conv = await createConversation({
                    agentId: DEFAULT_AGENT_ID,
                })
                convId = conv.id
                persistConversationId(conv.id)
            } catch (e) {
                const msg = e instanceof Error ? e.message : "Could not create conversation"
                toast.error(msg)
                setBooting(false)
                return
            } finally {
                setBooting(false)
            }
        }

        const snapshot = [...pendingImages]
        setInput("")
        setPendingImages([])
        snapshot.forEach((p) => URL.revokeObjectURL(p.previewUrl))

        const mediaIds: string[] = []
        const imageUrls: string[] = []
        if (snapshot.length > 0) {
            setIsUploading(true)
            try {
                for (const p of snapshot) {
                    const hosted = await uploadToCloudinary(p.blob)
                    const id = await registerChatMedia(hosted)
                    mediaIds.push(id)
                    imageUrls.push(hosted)
                }
            } catch (e) {
                const msg =
                    e instanceof Error ? e.message : "Image upload or registration failed"
                toast.error(msg)
                setIsUploading(false)
                return
            } finally {
                setIsUploading(false)
            }
        }

        const hidden = text.trimStart().startsWith(HIDDEN_MESSAGE_MARKER)
        const userMsgId = `local-user-${Date.now()}`
        const asstMsgId = `local-asst-${Date.now()}`
        const appendText =
            mediaIds.length > 0 ? formatAppendTextForMediaIds(mediaIds) : undefined
        setMessages((prev) => {
            const next = [...prev]
            if (!hidden) {
                next.push({
                    id: userMsgId,
                    role: "user",
                    content: text,
                    append_text: appendText,
                    mediaIds: mediaIds.length ? mediaIds : undefined,
                    imageUrls: imageUrls.length ? imageUrls : undefined,
                })
            }
            next.push({
                id: asstMsgId,
                role: "assistant",
                content: "",
                streaming: true,
                toolsUsed: [],
            })
            return next
        })
        setStreaming(true)

        const ac = new AbortController()
        abortRef.current = ac

        try {
            await streamAssistantReply(
                convId,
                text,
                ac.signal,
                (ev) => {
                    if (ev.type === "token") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === asstMsgId
                                    ? {
                                          ...m,
                                          content: m.content + ev.text,
                                      }
                                    : m
                            )
                        )
                    } else if (ev.type === "tool_end") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === asstMsgId
                                    ? {
                                          ...m,
                                          toolsUsed: [
                                              ...(m.toolsUsed ?? []),
                                              ev.name,
                                          ],
                                      }
                                    : m
                            )
                        )
                    } else if (ev.type === "done") {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.id === asstMsgId
                                    ? { ...m, id: ev.message_id, streaming: false }
                                    : m
                            )
                        )
                    } else if (ev.type === "error") {
                        toast.error(ev.message)
                        setMessages((prev) => prev.filter((m) => m.id !== asstMsgId))
                    }
                },
                mediaIds.length ? { mediaIds } : undefined
            )
        } catch (e) {
            if ((e as Error).name === "AbortError") return
            const msg = e instanceof Error ? e.message : "Stream failed"
            toast.error(msg)
            setMessages((prev) => prev.filter((m) => m.id !== asstMsgId))
        } finally {
            setStreaming(false)
            abortRef.current = null
            setMessages((prev) =>
                prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
            )
        }
    }, [
        accessToken,
        baseConfigured,
        conversationId,
        input,
        isUploading,
        pendingImages,
        persistConversationId,
        streaming,
    ])

    const sendTextOnly = useCallback(
        async (text: string) => {
            if (!text.trim()) return
            if (streaming || isUploading || booting || !accessToken) return

            // Temporarily stash existing pending images; this send is text-only.
            const prev = pendingImages
            if (prev.length) setPendingImages([])
            try {
                setInput(text)
                await handleSend()
            } finally {
                // Restore pending images; do not lose attachments.
                if (prev.length) setPendingImages(prev)
            }
        },
        [accessToken, booting, handleSend, isUploading, pendingImages, streaming]
    )

    const sendHiddenToAgent = useCallback(
        async (text: string) => {
            const content = text.trim()
            if (!content) return
            if (streaming || isUploading || booting || !accessToken) return
            if (!baseConfigured) {
                toast.error("API URL is not configured (NEXT_PUBLIC_API_URL).")
                return
            }

            let convId = conversationId
            if (!convId) {
                setBooting(true)
                try {
                    const conv = await createConversation({
                        agentId: DEFAULT_AGENT_ID,
                    })
                    convId = conv.id
                    persistConversationId(conv.id)
                } catch (e) {
                    const msg =
                        e instanceof Error ? e.message : "Could not create conversation"
                    toast.error(msg)
                    setBooting(false)
                    return
                } finally {
                    setBooting(false)
                }
            }

            const asstMsgId = `local-asst-${Date.now()}`
            setMessages((prev) => [
                ...prev,
                {
                    id: asstMsgId,
                    role: "assistant",
                    content: "",
                    streaming: true,
                    toolsUsed: [],
                },
            ])
            setStreaming(true)

            const ac = new AbortController()
            abortRef.current = ac

            try {
                await streamAssistantReply(
                    convId,
                    content,
                    ac.signal,
                    (ev) => {
                        if (ev.type === "token") {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === asstMsgId
                                        ? { ...m, content: m.content + ev.text }
                                        : m
                                )
                            )
                        } else if (ev.type === "tool_end") {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === asstMsgId
                                        ? {
                                              ...m,
                                              toolsUsed: [
                                                  ...(m.toolsUsed ?? []),
                                                  ev.name,
                                              ],
                                          }
                                        : m
                                )
                            )
                        } else if (ev.type === "done") {
                            setMessages((prev) =>
                                prev.map((m) =>
                                    m.id === asstMsgId
                                        ? { ...m, id: ev.message_id, streaming: false }
                                        : m
                                )
                            )
                        } else if (ev.type === "error") {
                            toast.error(ev.message)
                            setMessages((prev) => prev.filter((m) => m.id !== asstMsgId))
                        }
                    }
                )
            } catch (e) {
                if ((e as Error).name === "AbortError") return
                const msg = e instanceof Error ? e.message : "Stream failed"
                toast.error(msg)
                setMessages((prev) => prev.filter((m) => m.id !== asstMsgId))
            } finally {
                setStreaming(false)
                abortRef.current = null
                setMessages((prev) =>
                    prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
                )
            }
        },
        [
            accessToken,
            baseConfigured,
            booting,
            conversationId,
            isUploading,
            persistConversationId,
            streaming,
        ]
    )

    const canChat = hasHydrated && !!accessToken && baseConfigured
    const shouldHideOnRoute = pathname === "/maps" || pathname.startsWith("/maps/")

    if (shouldHideOnRoute) {
        return null
    }

    return (
        <>
            <button
                type="button"
                aria-label={open ? "Close assistant" : "Open assistant"}
                onClick={() => setOpen((v) => !v)}
                className={cn(
                    "fixed bottom-6 right-6 z-[100] flex size-14 items-center justify-center rounded-full border border-[#6d7b36]/30 bg-[#6d7b36] text-white shadow-[var(--neutral-shadows-400)] transition hover:bg-[#5c6a2d] focus-visible:ring-2 focus-visible:ring-[#9cab84] focus-visible:outline-none"
                )}
            >
                {open ? <X className="size-6" /> : <MessageCircle className="size-6" />}
            </button>

            {open && (
                <div
                    className={cn(
                        "fixed bottom-[5.5rem] right-6 z-[100] flex w-[min(calc(100vw-2rem),400px)] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[var(--neutral-shadows-500)]",
                        "max-h-[min(calc(100dvh-8rem),560px)]"
                    )}
                    role="dialog"
                    aria-label="EcoLink assistant"
                >
                    <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold">EcoLink assistant</p>
                            {!baseConfigured && (
                                <p className="text-xs text-muted-foreground">
                                    Set NEXT_PUBLIC_API_URL
                                </p>
                            )}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={handleNewChat}
                            disabled={booting || streaming || isUploading}
                        >
                            <Plus className="size-4" />
                            New chat
                        </Button>
                    </div>

                    <div
                        ref={scrollRef}
                        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 scrollbar-hide"
                    >
                        {booting && messages.length === 0 && (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                        )}
                        {!booting && messages.length === 0 && (
                            <p className="text-sm text-muted-foreground">
                                {!hasHydrated
                                    ? "Preparing chat…"
                                    : !accessToken
                                      ? "Please sign in to chat with EcoLink assistant."
                                      : !baseConfigured
                                        ? "Set NEXT_PUBLIC_API_URL to connect via API Gateway."
                                        : "Ask about EcoLink, your organizations, or reports. Send a message to begin — a conversation is created automatically."}
                            </p>
                        )}
                        {messages.map((m) => (
                            <div
                                key={m.id}
                                className={cn(
                                    "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed break-words",
                                    m.role === "user"
                                        ? "ml-auto whitespace-pre-wrap bg-[#c5d89d]/80 text-foreground"
                                        : "mr-auto bg-muted text-foreground"
                                )}
                            >
                                {m.role === "assistant" &&
                                    (m.toolsUsed?.length ?? 0) > 0 && (
                                        <ul
                                            className="mb-2 flex flex-col gap-1 border-b border-border/60 pb-2 text-xs text-muted-foreground"
                                            aria-label="Tools used"
                                        >
                                            {m.toolsUsed!.map((name, i) => (
                                                <li
                                                    key={`${m.id}-tool-${i}-${name}`}
                                                    className="flex items-center gap-2"
                                                >
                                                    <span
                                                        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] leading-none text-white"
                                                        aria-hidden
                                                    >
                                                        ✓
                                                    </span>
                                                    <span className="font-mono text-[11px] text-foreground/90">
                                                        {name}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                {m.role === "assistant" ? (
                                    <>
                                        {m.content.trim() || !m.streaming ? (
                                            <AssistantMarkdown
                                                text={stripPickAddressAndUrlsForDisplay(
                                                    stripThinkingDisplay(m.content)
                                                )}
                                            />
                                        ) : (
                                            <span className="text-muted-foreground">
                                                …
                                            </span>
                                        )}
                                        {m.content.includes(PICK_ADDRESS_MARKER) && (
                                            <AddressPickerCard
                                                disabled={
                                                    streaming ||
                                                    booting ||
                                                    isUploading ||
                                                    !canChat
                                                }
                                                onSubmit={(payload) => {
                                                    const body = [
                                                        HIDDEN_MESSAGE_MARKER,
                                                        "detail_address:",
                                                        payload.detailAddress,
                                                        payload.latitude != null
                                                            ? `latitude: ${payload.latitude}`
                                                            : null,
                                                        payload.longitude != null
                                                            ? `longitude: ${payload.longitude}`
                                                            : null,
                                                    ]
                                                        .filter(Boolean)
                                                        .join("\n")
                                                    void sendHiddenToAgent(body)
                                                }}
                                            />
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {m.imageUrls && m.imageUrls.length > 0 && (
                                            <div className="mb-2 flex flex-wrap gap-1">
                                                {m.imageUrls.map((url, i) => (
                                                    <img
                                                        key={`${m.id}-img-${i}`}
                                                        src={url}
                                                        alt=""
                                                        className="h-14 w-14 rounded-md border border-[#6d7b36]/25 object-cover"
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {!m.imageUrls?.length &&
                                            (m.mediaIds?.length ?? 0) > 0 && (
                                                <p className="mb-1 text-xs opacity-80">
                                                    {m.mediaIds!.length} image(s)
                                                    attached
                                                </p>
                                            )}
                                        {m.content ? (
                                            <span className="whitespace-pre-wrap">
                                                {m.content}
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-border p-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => void onPickFiles(e)}
                        />
                        {pendingImages.length > 0 && (
                            <div className="mb-2 flex flex-wrap gap-2">
                                {pendingImages.map((p) => (
                                    <div
                                        key={p.id}
                                        className="relative inline-block"
                                    >
                                        <img
                                            src={p.previewUrl}
                                            alt=""
                                            className="h-14 w-14 rounded-md border border-border object-cover"
                                        />
                                        <button
                                            type="button"
                                            className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-background text-xs shadow"
                                            onClick={() => removePendingImage(p.id)}
                                            aria-label="Remove image"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0 self-end"
                                disabled={
                                    streaming ||
                                    booting ||
                                    isUploading ||
                                    !canChat ||
                                    pendingImages.length >= MAX_CHAT_IMAGES
                                }
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="Attach images"
                            >
                                <ImagePlus className="size-4" />
                            </Button>
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message…"
                                rows={2}
                                className="min-h-[44px] resize-none text-sm"
                                disabled={
                                    streaming || booting || isUploading || !canChat
                                }
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault()
                                        void handleSend()
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                size="icon"
                                className="shrink-0 self-end bg-[#6d7b36] hover:bg-[#5c6a2d]"
                                disabled={
                                    (!input.trim() &&
                                        pendingImages.length === 0) ||
                                    streaming ||
                                    booting ||
                                    isUploading ||
                                    !canChat
                                }
                                onClick={() => void handleSend()}
                                aria-label="Send"
                            >
                                <SendHorizontal className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
