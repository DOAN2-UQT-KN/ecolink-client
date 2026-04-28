import requestApi from "@/utils/requestApi"

export type RegisterChatMediaResponse = {
    media: {
        id: string
        url: string
        type?: string
        created_at?: string | null
    }
}

const url = "/api/v1/chat/media"

export async function registerChatMedia(imageUrl: string): Promise<string> {
    const res = await requestApi.post<RegisterChatMediaResponse>(url, {
        imageUrl,
    })
    const id = res.media?.id
    if (!id) {
        throw new Error("Missing media id from server")
    }
    return id
}
