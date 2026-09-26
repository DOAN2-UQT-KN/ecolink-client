import { create } from "zustand"
import { persist } from "zustand/middleware"
import useAuthStore from "@/stores/useAuthStore"

/**
 * Which organization the "Manage" pages are scoped to (null = personal). Client-side only:
 * the server checks the caller's role on every request, so switching grants nothing.
 */
interface OrgContextState {
    activeOrganizationId: string | null
    setActiveOrganizationId: (id: string | null) => void
}

const useOrgContextStore = create<OrgContextState>()(
    persist(
        (set) => ({
            activeOrganizationId: null,
            setActiveOrganizationId: (id) => set({ activeOrganizationId: id }),
        }),
        { name: "org_context_store" },
    ),
)

// The context belongs to the signed-in person: drop it when they sign out.
useAuthStore.subscribe((state, previous) => {
    if (previous.user && !state.user) {
        useOrgContextStore.getState().setActiveOrganizationId(null)
    }
})

export default useOrgContextStore
