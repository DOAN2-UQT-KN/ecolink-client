"use client";

import { useContext } from "react";
import { IncidentContext } from "../_context/IncidentContext";

export const useIncident = () => {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error(
      "useIncident must be used within an IncidentProvider",
    );
  }
  return context;
};
