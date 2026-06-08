import { Outlet } from "react-router-dom";

import LanguageSwitcher from "@/components/client/shared/LanguageSwitcher";
import AppImage from "@/components/ui/AppImage";

export default function AuthLayout() {
  return (
    <div className="flex flex-row overflow-auto relative min-h-screen">
      <div className="hidden lg:block w-3/5 relative">
        <AppImage
          src="/auth-bg.jpeg"
          alt="environment"
          fill
          className="object-cover"
        />
      </div>
      <Outlet />
      <div className="absolute bottom-5 right-5">
        <LanguageSwitcher showName />
      </div>
    </div>
  );
}
