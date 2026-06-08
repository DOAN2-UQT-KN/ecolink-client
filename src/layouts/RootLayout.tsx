import { Outlet } from "react-router-dom";

import "@/app/globals.css";
import I18nProvider from "@/components/client/providers/I18nProvider";
import ReactQueryProvider from "@/components/client/providers/ReactQueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/libs/utils";

export default function RootLayout() {
  return (
    <div className={cn("font-sans min-h-screen", "[--font-sans:Inter,sans-serif]")}>
      <ReactQueryProvider>
        <TooltipProvider>
          <I18nProvider>
            <Outlet />
          </I18nProvider>
        </TooltipProvider>
      </ReactQueryProvider>
      <Toaster />
    </div>
  );
}
