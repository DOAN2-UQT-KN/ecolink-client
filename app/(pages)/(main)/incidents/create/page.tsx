"use client";

import { useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { HiArrowsPointingOut, HiArrowsPointingIn } from "react-icons/hi2";

import Address from "./_components/Address";
import FileUpload from "./_components/FileUpload";
import Information from "./_components/Information";

import { IncidentProvider } from "./_components/IncidentContext";
import { Button } from "@/components/shared/Button";

export default function CreateIncidentPage() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const content = (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] flex flex-col bg-white overflow-auto"
          : "w-full"
      }
    >
      {/* Fullscreen toggle button */}
      <div className={`flex justify-end ${isFullscreen ? "p-4" : "mb-3"}`}>
        <Button
          onClick={() => setIsFullscreen((prev) => !prev)}
          variant="outlined-brown"
          className="w-10 h-10"
        >
          {isFullscreen ? (
            <>
              <HiArrowsPointingIn size={24} />
            </>
          ) : (
            <>
              <HiArrowsPointingOut size={24} />
            </>
          )}
        </Button>
      </div>

      {/* Main panel */}
      <div
        className={`
          flex flex-col md:grid md:grid-cols-2 gap-[30px]
          isolate border-3 border-white rounded-[20px] bg-white/20 shadow-lg ring-1 ring-white/5
          ${isFullscreen ? "flex-1 m-4 mt-0 p-[40px]" : "p-[40px]"}
        `}
      >
        <Information />
        <div className="flex flex-col gap-[30px]">
          <FileUpload />
          <Address />
        </div>
      </div>
    </div>
  );

  return <IncidentProvider>{content}</IncidentProvider>;
}
