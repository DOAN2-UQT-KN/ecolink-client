import { useContext } from "react";
import { ApplicationContext } from "../_context/ApplicationContext";

export const useApplication = () => {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error(
      "useApplication must be used within an ApplicationProvider",
    );
  }
  return context;
};
