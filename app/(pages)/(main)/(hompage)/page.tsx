"use client";

import { useEffect } from "react";
import { getMe } from "@/apis/auth/getMe";
import HeroSection from "./_components/HeroSection";
import { Divider } from "@/components/client/shared/Divider";
import ProblemAndSolution from "./_components/ProblemAndSolution";
import ForVolunteers from "./_components/ForVolunteers";
import ForCitizens from "./_components/ForCitizens";
import CallToAction from "./_components/CallToAction";

export default function Home() {
  useEffect(() => {
    void getMe().catch(() => undefined);
  }, []);

  return (
    <div className="flex flex-col  items-center justify-center  bg-background-primary font-sans dark:bg-black">
      <HeroSection />

      <Divider className="text-background-tertiary my-15" />

      <ProblemAndSolution />

      <Divider className="text-background-tertiary my-15" />

      <ForVolunteers />

      <Divider className="text-background-tertiary my-15" />

      <ForCitizens />

      <Divider className="text-background-tertiary my-15" />

      <CallToAction />
    </div>
  );
}
