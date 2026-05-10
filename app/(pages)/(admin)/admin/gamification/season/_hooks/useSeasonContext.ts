"use client";

import { useContext } from "react";

import { SeasonContext } from "../_context/useSeasonContext";

export function useSeasonContext() {
  const ctx = useContext(SeasonContext);
  if (!ctx) {
    throw new Error("useSeasonContext must be used within SeasonProvider");
  }
  return ctx;
}
