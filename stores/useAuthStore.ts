import type { IUser } from "@/apis/auth/models/user"
import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
interface AuthState {
    is_verified: boolean
    is_authenticated: boolean
    accessToken?: string
    refreshToken?: string
    user?: IUser
    permissions?: string[]
    ip?: string
    has_hydrated: boolean
    setLoginSuccess: (
        accessToken: string,
        user: IUser,
        refreshToken: string,
        permissions?: string[]
    ) => void
    setVerifySuccess: (permissions?: string[], ip?: string) => void
    setLogoutSuccess: () => void
    setIsVerified: (is_verified: boolean) => void
    setIsAuthenticated: (is_authenticated: boolean) => void
    setAccessToken: (token?: string) => void
    setRefreshToken: (token?: string) => void
    setUser: (user?: IUser) => void
    setPermissions: (permissions?: string[]) => void
    setHasHydrated: (state: boolean) => void
}

const useAuthStore = create<AuthState>()(
    devtools(
        persist(
            (set) => ({
                is_verified: false,
                is_authenticated: false,
                has_hydrated: false,
                setLoginSuccess: (accessToken, user, refreshToken, permissions) => {
                    set({
                        is_verified: true,
                        is_authenticated: true,
                        accessToken,
                        refreshToken,
                        user,
                        permissions,
                    })
                },
                setVerifySuccess: (permissions, ip) => {
                    set({
                        is_verified: true,
                        is_authenticated: true,
                        permissions,
                        ip,
                    })
                },
                setLogoutSuccess: () => {
                    set({
                        is_verified: true,
                        is_authenticated: false,
                        accessToken: undefined,
                        refreshToken: undefined,
                        user: undefined,
                        permissions: undefined,
                        ip: undefined,
                    })
                },
                setIsVerified: (is_verified) => {
                    set({
                        is_verified,
                    })
                },
                setIsAuthenticated: (is_authenticated) => {
                    set({
                        is_authenticated,
                    })
                },
                setAccessToken: (accessToken) => {
                    set({
                        accessToken,
                    })
                },
                setRefreshToken: (refreshToken) => {
                    set({
                        refreshToken,
                    })
                },
                setUser: (user) => {
                    set({
                        user,
                    })
                },
                setPermissions: (permissions) => {
                    set({
                        permissions,
                    })
                },
                setHasHydrated: (state) => {
                    set({
                        has_hydrated: state,
                    })
                },
            }),
            {
                name: "auth_store",
                partialize: ({ accessToken, user, refreshToken, permissions, ip }) => ({
                    accessToken,
                    user,
                    refreshToken,
                    permissions,
                    ip,
                }),
                onRehydrateStorage: () => (state) => {
                    // `is_authenticated` is not persisted; restore it when we still have a session.
                    if (state?.accessToken && state?.user) {
                        state.setIsAuthenticated(true)
                        state.setIsVerified(true)
                    }
                    state?.setHasHydrated(true)
                },
            }
        )
        // { enabled: import.meta.env.DEV }
    )
)

export default useAuthStore
