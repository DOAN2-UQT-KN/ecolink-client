import { ReactNode } from 'react';

import { ProfileTabs } from './_components/ProfileTabs';

type ProfileLayoutProps = {
  children: ReactNode;
};

export default function ProfileLayout({ children }: ProfileLayoutProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <aside className="w-[200px]">
        <ProfileTabs />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
