import { Outlet } from "react-router-dom";

import { ProfileTabs } from "@/app/(pages)/(main)/profile/_components/ProfileTabs";

export default function ProfileLayout() {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <aside className="w-[200px]">
        <ProfileTabs />
      </aside>
      <div className="min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}
