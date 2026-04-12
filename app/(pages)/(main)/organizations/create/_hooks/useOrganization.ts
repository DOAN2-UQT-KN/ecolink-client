"use client";

import { useContext } from "react";
import { OrganizationContext } from "../_context/OrganizationContext";

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider",
    );
  }
  return context;
};
