"use client";

import { useContext } from "react";

import { BadgeAdminContext } from "../_context/BadgeAdminContext";

export function useBadgeAdminContext() {
  const ctx = useContext(BadgeAdminContext);
  if (!ctx) {
    throw new Error("useBadgeAdminContext must be used within BadgeAdminProvider");
  }
  return ctx;
}
