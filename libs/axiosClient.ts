import useAuthStore from "@/stores/useAuthStore"
import { acceptLanguageHeader, getApiLocale } from "@/libs/getApiLocale"
import axios, {
    AxiosError,
    HttpStatusCode,
    type AxiosResponse,
    type CreateAxiosDefaults,
    type InternalAxiosRequestConfig,
} from "axios"
import queryString from "query-string"

const getBaseUrl = (): string => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
    if (typeof window !== "undefined") return window.location.origin
    return ""
}

const onRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const accessToken = useAuthStore.getState().accessToken
    const refreshToken = useAuthStore.getState().refreshToken

    if (refreshToken) config.headers["X-Refresh-Token"] = refreshToken
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`

    const locale = getApiLocale()
    config.headers["Accept-Language"] = acceptLanguageHeader(locale)

    if (config.method?.toLowerCase() === "get") {
      const params =
        config.params && typeof config.params === "object"
          ? { ...(config.params as Record<string, unknown>) }
          : {}
      if (params.lang === undefined) {
        params.lang = locale
      }
      config.params = params
    }

    return config
}

const onRequestError = (error: AxiosError): Promise<AxiosError> => {
    return Promise.reject(error)
}

const onResponse = (response: AxiosResponse): AxiosResponse => {
    return response
}

const onResponseError = async (error: any): Promise<any> => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    // Check for 401 and not a retry, and not the refresh-token URL itself
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/api/v1/auth/refresh-token")) {
        originalRequest._retry = true
        
        const refreshTokenVal = useAuthStore.getState().refreshToken
        
        if (refreshTokenVal) {
            try {
                // Call refresh token API directly with raw axios to avoid interceptor loop
                const response = await axios.post(
                    `${getBaseUrl()}/api/v1/auth/refresh-token`,
                    { refreshToken: refreshTokenVal }
                )
                
                if (response.data?.data) {
                    const { access_token: newAccessToken, refresh_token: newRefreshToken } = response.data.data
                    
                    // Update store
                    useAuthStore.getState().setAccessToken(newAccessToken)
                    useAuthStore.getState().setRefreshToken(newRefreshToken || refreshTokenVal)
                    
                    // Update cookie
                    if (typeof document !== "undefined") {
                        document.cookie = `refresh_token=${newRefreshToken || refreshTokenVal}; path=/; Max-Age=2592000; Secure; SameSite=Lax`
                    }
                    
                    // Update current request and retry
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                    
                    return axiosClient(originalRequest)
                }
            } catch (refreshError) {
                // If refresh fails, log out
                useAuthStore.getState().setLogoutSuccess()
                if (typeof document !== "undefined") {
                    document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                }
                if (typeof window !== "undefined") {
                    const redirect = encodeURIComponent(window.location.pathname + window.location.search)
                    window.location.href = `/sign-in?redirect=${redirect}`
                }
                return Promise.reject(refreshError)
            }
        } else {
            useAuthStore.getState().setLogoutSuccess()
            if (typeof window !== "undefined") {
                const redirect = encodeURIComponent(window.location.pathname + window.location.search)
                window.location.href = `/sign-in?redirect=${redirect}`
            }
        }
    }

    return Promise.reject(
        typeof error.response?.data === "object" &&
            error.response.status !== HttpStatusCode.NotFound
            ? { ...error.response.data, status: error.response.status }
            : error
    )
}

const config: CreateAxiosDefaults = {
    baseURL: getBaseUrl(),
    timeout: 120000,
    headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Expose-Headers": "Authorization",
    },
    paramsSerializer: (params) => queryString.stringify(params, { arrayFormat: "comma" }),
}
const axiosClient = axios.create(config)
axiosClient.interceptors.request.use(onRequest, onRequestError)
axiosClient.interceptors.response.use(onResponse, onResponseError)

export default axiosClient
