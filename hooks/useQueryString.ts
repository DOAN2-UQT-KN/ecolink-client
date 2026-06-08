import { useMemo } from "react";
import { usePathname, useSearchParams } from "@/libs/router";

const useQueryString = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useMemo(() => new URLSearchParams(searchParams.toString()), [
    pathname,
    searchParams,
  ]);
};

export default useQueryString;
