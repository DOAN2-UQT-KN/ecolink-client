"use client";

import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-row  overflow-auto relative min-h-screen">
      <div className="hidden lg:block w-3/5 relative">
        <Image
          src="/auth-bg.jpeg"
          alt="environment"
          fill
          className="object-cover"
        />
      </div>
      {children}
      <div className="absolute bottom-5 right-5">
        <LanguageSwitcher showName />
      </div>
    </div>
  );
}
