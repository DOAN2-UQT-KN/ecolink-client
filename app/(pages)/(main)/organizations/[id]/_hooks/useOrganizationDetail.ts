"use client";

import { useContext } from "react";
import { OrganizationDetailContext } from "../_context/OrganizationDetailContext";

export const useOrganizationDetail = () => {
  const context = useContext(OrganizationDetailContext);
  if (!context) {
    throw new Error(
      "useOrganizationDetail must be used within an OrganizationDetailProvider",
    );
  }
  return context;
};
