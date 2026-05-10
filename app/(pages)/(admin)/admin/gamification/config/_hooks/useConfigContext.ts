"use client";

import { useContext } from "react";
import { ConfigContext } from "../_context/useConfigContext";

export function useConfigContext() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfigContext must be used within ConfigProvider");
  }
  return context;
}
