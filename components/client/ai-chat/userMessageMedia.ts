/** Aligns with ai-service `app/chat/user_message_media.py` */

export const USER_MEDIA_IDS_MARKER = "\n\nmedia_ids:\n"

const UUID_RE =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Persist on `append_text` — agent context, not the user bubble body. */
export function formatAppendTextForMediaIds(mediaIds: string[]): string {
    const ids = mediaIds.map((x) => x.trim()).filter(Boolean)
    if (!ids.length) return ""
    return "media_ids:\n" + ids.join("\n") + "\n"
}

export function parseMediaIdsFromAppendText(append: string | null | undefined): string[] {
    if (!append?.trim()) return []
    const lines = append.trim().split("\n")
    let start = 0
    if (lines[0]?.trim().toLowerCase() === "media_ids:") {
        start = 1
    }
    return lines
        .slice(start)
        .map((s) => s.trim())
        .filter((s) => UUID_RE.test(s))
}

/** Legacy: `media_ids:` block embedded in `content`. */
export function parseUserMessageMediaIds(content: string): {
    body: string
    mediaIds: string[]
} {
    const idx = content.lastIndexOf(USER_MEDIA_IDS_MARKER)
    if (idx < 0) return { body: content.trimEnd(), mediaIds: [] }
    const body = content.slice(0, idx).trimEnd()
    const rest = content.slice(idx + USER_MEDIA_IDS_MARKER.length)
    const mediaIds = rest
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => UUID_RE.test(s))
    return { body, mediaIds }
}
