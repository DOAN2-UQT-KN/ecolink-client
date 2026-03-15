"use client";

import HeroSection from "./_components/HeroSection";
import { Divider } from "@/components/shared/Divider";
import ProblemAndSolution from "./_components/ProblemAndSolution";

export default function Home() {
  return (
    <div className="flex flex-col  items-center justify-center  bg-background-primary font-sans dark:bg-black py-[92px]">
      <HeroSection />

      <Divider className="text-background-tertiary my-15" />

      <ProblemAndSolution />
    </div>
  );
}
