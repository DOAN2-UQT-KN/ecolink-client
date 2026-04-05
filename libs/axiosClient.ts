import useAuthStore from "@/stores/useAuthStore"
import axios, {
    AxiosError,
    HttpStatusCode,
    type AxiosResponse,
    type CreateAxiosDefaults,
    type InternalAxiosRequestConfig,
} from "axios"
import queryString from "query-string"

const onRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const accessToken = useAuthStore.getState().accessToken
    const refreshToken = useAuthStore.getState().refreshToken

    if (refreshToken) config.headers["X-Refresh-Token"] = refreshToken
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
    // config.headers["Accept-Language"] = layoutState;
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
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes("/auth/refresh-token")) {
        originalRequest._retry = true
        
        const refreshTokenVal = useAuthStore.getState().refreshToken
        
        if (refreshTokenVal) {
            try {
                // Call refresh token API directly with raw axios to avoid interceptor loop
                const response = await axios.post(
                    (process.env.NEXT_PUBLIC_API_URL || window.location.origin) + "/auth/refresh-token",
                    { refreshToken: refreshTokenVal }
                )
                
                if (response.data?.data) {
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data
                    
                    // Update store
                    useAuthStore.getState().setAccessToken(newAccessToken)
                    useAuthStore.getState().setRefreshToken(newRefreshToken)
                    
                    // Update cookie
                    document.cookie = `refresh_token=${newRefreshToken}; path=/; Max-Age=2592000; Secure; SameSite=Lax`
                    
                    // Update current request and retry
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                    
                    return axiosClient(originalRequest)
                }
            } catch (refreshError) {
                // If refresh fails, log out
                useAuthStore.getState().setLogoutSuccess()
                document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
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
    baseURL: process.env.NEXT_PUBLIC_API_URL || window.location.origin,
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
