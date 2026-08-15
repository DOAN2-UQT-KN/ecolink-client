import { Outlet } from "react-router-dom";
import { Suspense } from "react";

import Header from "@/components/client/layout/Header";
import Footer from "@/components/client/layout/Footer";
import ClickSpark from "@/components/ui/ClickSpark";
import AiChatWidget from "@/components/client/ai-chat/AiChatWidget";

export default function MainLayout() {
  return (
    <>
      <Header />
      <ClickSpark
        sparkColor="#665814"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <main className="py-[92px] px-[20px] lg:px-[80px]">
          <Outlet />
        </main>
      </ClickSpark>
      <Suspense fallback={null}>
        <AiChatWidget />
      </Suspense>
      <Footer />
    </>
  );
}
