import { create } from "zustand"
import { persist } from "zustand/middleware"
import useAuthStore from "@/stores/useAuthStore"


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

useAuthStore.subscribe((state, previous) => {
    if (previous.user && !state.user) {
        useOrgContextStore.getState().setActiveOrganizationId(null)
    }
})

export default useOrgContextStore
