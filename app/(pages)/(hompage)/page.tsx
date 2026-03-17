"use client";

import HeroSection from "./_components/HeroSection";
import { Divider } from "@/components/shared/Divider";
import ProblemAndSolution from "./_components/ProblemAndSolution";
import ForVolunteers from "./_components/ForVolunteers";
import ForCitizens from "./_components/ForCitizens";
import CallToAction from "./_components/CallToAction";

export default function Home() {
  return (
    <div className="flex flex-col  items-center justify-center  bg-background-primary font-sans dark:bg-black py-[92px]">
      <HeroSection />

      <Divider className="text-background-tertiary my-15" />

      <ProblemAndSolution />

      <Divider className="text-background-tertiary my-15" />

      <ForVolunteers />

      <Divider />

      <ForCitizens />

      <Divider />

      <CallToAction />
    </div>
  );
}
