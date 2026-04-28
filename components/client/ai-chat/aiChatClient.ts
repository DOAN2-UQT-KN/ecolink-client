"use client"

/**
 * Chat client via api-gateway — same stack as `getMe` / other APIs:
 * JSON calls use `requestApi` (axiosClient + interceptors).
 * SSE stream uses `fetch` (axios cannot stream response body in the browser).
 */

import axiosClient from "@/libs/axiosClient"
import requestApi from "@/utils/requestApi"
import useAuthStore from "@/stores/useAuthStore"

export const DEFAULT_AGENT_ID = "ecolink_assistant"

const CHAT_CONVERSATIONS = "/api/v1/chat/conversations"

export function isChatApiConfigured(): boolean {
    const base =
        (typeof window !== "undefined" && axiosClient.defaults.baseURL) ||
        process.env.NEXT_PUBLIC_API_URL ||
        ""
    return !!String(base).trim()
}

export type ChatMessageDto = {
    id: string
    role: string
    content: string | null
    /** Extra context for the model (e.g. `media_ids:` lines) */
    append_text?: string | null
    created_at?: string | null
}

export type CreateConversationResult = {
    id: string
    agent_id: string
    title: string | null
    created_at: string | null
}

function parseApiError(err: unknown): string {
    if (typeof err === "object" && err !== null) {
        const o = err as Record<string, unknown>
        if (typeof o.detail === "string") return o.detail
        if (Array.isArray(o.detail)) {
            try {
                return JSON.stringify(o.detail)
            } catch {
                return "Request failed"
            }
        }
        if (typeof o.message === "string") return o.message
    }
    if (err instanceof Error) return err.message
    return "Request failed"
}

async function parseFetchError(res: Response): Promise<string> {
    try {
        const j = (await res.json()) as { detail?: unknown }
        if (typeof j.detail === "string") return j.detail
        return res.statusText || "Request failed"
    } catch {
        return res.statusText || "Request failed"
    }
}

export async function createConversation(options?: {
    agentId?: string
    title?: string | null
}): Promise<CreateConversationResult> {
    if (!isChatApiConfigured()) {
        throw new Error("NEXT_PUBLIC_API_URL is not set")
    }
    try {
        const data = await requestApi.post<{
            conversation: CreateConversationResult
        }>(CHAT_CONVERSATIONS, {
            agentId: options?.agentId ?? DEFAULT_AGENT_ID,
            title: options?.title ?? null,
        })
        return data.conversation
    } catch (e) {
        throw new Error(parseApiError(e))
    }
}

export async function listMessages(
    conversationId: string
): Promise<ChatMessageDto[]> {
    if (!isChatApiConfigured()) {
        throw new Error("NEXT_PUBLIC_API_URL is not set")
    }
    try {
        const data = await requestApi.get<{ messages: ChatMessageDto[] }>(
            `${CHAT_CONVERSATIONS}/${conversationId}/messages`
        )
        return data.messages ?? []
    } catch (e) {
        throw new Error(parseApiError(e))
    }
}

function parseSseBlock(block: string): { event: string; data: unknown } | null {
    let event = "message"
    const dataLines: string[] = []
    for (const line of block.split("\n")) {
        const l = line.replace(/\r$/, "")
        if (l.startsWith("event:")) event = l.slice(6).trim()
        else if (l.startsWith("data:")) dataLines.push(l.slice(5).trimStart())
    }
    if (dataLines.length === 0) return null
    const dataStr = dataLines.join("\n")
    try {
        return { event, data: JSON.parse(dataStr) as unknown }
    } catch {
        return { event, data: dataStr }
    }
}

async function* sseEventsFromResponse(
    body: ReadableStream<Uint8Array>
): AsyncGenerator<{ event: string; data: unknown }> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const parts = buffer.split("\n\n")
            buffer = parts.pop() ?? ""
            for (const raw of parts) {
                if (!raw.trim()) continue
                const parsed = parseSseBlock(raw)
                if (parsed) yield parsed
            }
        }
        if (buffer.trim()) {
            const parsed = parseSseBlock(buffer)
            if (parsed) yield parsed
        }
    } finally {
        reader.releaseLock()
    }
}

export type StreamChatEvent =
    | { type: "token"; text: string }
    | { type: "tool_start"; tool_call_id: string; name: string }
    | { type: "tool_end"; tool_call_id: string; name: string; result_preview?: string }
    | { type: "done"; message_id: string }
    | { type: "error"; message: string }

function mapSseToStreamEvent(
    event: string,
    data: unknown
): StreamChatEvent | null {
    if (typeof data !== "object" || data === null) return null
    const d = data as Record<string, unknown>
    if (event === "token" && typeof d.text === "string") {
        return { type: "token", text: d.text }
    }
    if (event === "tool_start") {
        const id = d.tool_call_id
        const name = d.name
        if (typeof id === "string" && typeof name === "string") {
            return { type: "tool_start", tool_call_id: id, name }
        }
    }
    if (event === "tool_end") {
        const id = d.tool_call_id
        const name = d.name
        if (typeof id === "string" && typeof name === "string") {
            return {
                type: "tool_end",
                tool_call_id: id,
                name,
                result_preview:
                    typeof d.result_preview === "string"
                        ? d.result_preview
                        : undefined,
            }
        }
    }
    if (event === "done" && typeof d.message_id === "string") {
        return { type: "done", message_id: d.message_id }
    }
    if (event === "error" && typeof d.message === "string") {
        return { type: "error", message: d.message }
    }
    return null
}

/** Same auth headers as `libs/axiosClient` `onRequest` (Bearer + X-Refresh-Token). */
function chatStreamAuthHeaders(): Headers {
    const headers = new Headers()
    headers.set("Content-Type", "application/json")
    headers.set("Accept", "text/event-stream")
    const accessToken = useAuthStore.getState().accessToken
    const refreshToken = useAuthStore.getState().refreshToken
    if (refreshToken) headers.set("X-Refresh-Token", refreshToken)
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
    return headers
}

/**
 * POST /messages/stream and consume SSE (same contract as ai-service `format_sse`).
 * Uses `fetch` because axios cannot consume streaming bodies in the browser.
 */
export type StreamAssistantOptions = {
    mediaIds?: string[]
}

export async function streamAssistantReply(
    conversationId: string,
    content: string,
    signal: AbortSignal,
    onEvent: (ev: StreamChatEvent) => void,
    options?: StreamAssistantOptions
): Promise<void> {
    if (!isChatApiConfigured()) {
        throw new Error("NEXT_PUBLIC_API_URL is not set")
    }

    const streamPath = `${CHAT_CONVERSATIONS}/${conversationId}/messages/stream`
    const url = axiosClient.getUri({ url: streamPath })

    const body: Record<string, unknown> = { content }
    if (options?.mediaIds?.length) {
        body.mediaIds = options.mediaIds
    }

    const res = await fetch(url, {
        method: "POST",
        headers: chatStreamAuthHeaders(),
        body: JSON.stringify(body),
        signal,
    })

    if (!res.ok) {
        const msg = await parseFetchError(res)
        throw new Error(msg)
    }

    if (!res.body) throw new Error("No response body")

    for await (const { event, data } of sseEventsFromResponse(res.body)) {
        const mapped = mapSseToStreamEvent(event, data)
        if (mapped) onEvent(mapped)
    }
}
