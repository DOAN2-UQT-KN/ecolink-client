/** Strip model-internal think blocks (mirrors ai-service `thinking_strip` patterns). */

const BQ = "\u0060"
const LT = "\u003c"
const GT = "\u003e"
const SL = "\u002f"

function escapeRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const OPEN_TAGS = [
    `${BQ}${BQ}think${BQ}${BQ}`,
    `${BQ}think${BQ}`,
    `${LT}think${GT}`,
    `${LT}thinking${GT}`,
    `${LT}thought${GT}`,
    `${LT}redacted_thinking${GT}`,
]

const CLOSE_TAGS = [
    `${BQ}${BQ}think${BQ}${BQ}`,
    `${BQ}think${BQ}`,
    `${LT}${SL}think${GT}`,
    `${LT}${SL}thinking${GT}`,
    `${LT}${SL}thought${GT}`,
    `${LT}${SL}redacted_thinking${GT}`,
]

const THINK_BLOCK_RE = new RegExp(
    `(?:${OPEN_TAGS.map(escapeRe).join("|")}).*?(?:${CLOSE_TAGS.map(escapeRe).join("|")})`,
    "gis"
)

export function stripThinkingDisplay(text: string): string {
    if (!text) return text
    let cleaned = text.replace(THINK_BLOCK_RE, "")
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n")
    return cleaned.trim()
}
