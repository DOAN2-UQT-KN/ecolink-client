"use client";

import Address from "./_components/Address";
import FileUpload from "./_components/FileUpload";
import Information from "./_components/Information";

import { IncidentProvider } from "./_components/IncidentContext";

export default function CreateIncidentPage() {
  return (
    <IncidentProvider>
      <div className="w-full flex flex-col p-[40px] md:grid md:grid-cols-2  gap-[30px] isolate aspect-video border-3 border-white w-96 rounded-[20px] bg-white/20 shadow-lg ring-1 ring-white/5">
        <Information />
        <div className="flex flex-col gap-[30px]">
          <FileUpload />
          <Address />
        </div>
      </div>
    </IncidentProvider>
  );
}
