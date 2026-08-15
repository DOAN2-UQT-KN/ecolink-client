import { format, isValid, parse } from "date-fns";
import useQueryString from "./useQueryString";

export type ParamType =
  | "number"
  | "array"
  | "string"
  | "boolean"
  | "date"
  | "datetime"
  | "arrayNumber";

const DATE_FORMAT = "dd-MM-yyyy";
const DATETIME_FORMAT = "dd-MM-yyyy HH:mm:ss";

const useGetParam = <T>(
  key: string,
  vType?: ParamType,
  vDefault?: T,
): T | undefined => {
  const query = useQueryString();
  const query_value = (query.get(key) || "").trim();
  if (
    query_value === "" ||
    ["null", "undefined"].indexOf(query_value || "") > -1
  ) {
    return vDefault;
  }
  switch (vType || "string") {
    case "number":
      if (!isNaN(Number(query_value))) {
        return Number(query_value) as T;
      }
      break;
    case "array":
      if (query_value) {
        return query_value.split(",").filter((item) => item) as T;
      }
      break;
    case "arrayNumber":
      if (query_value) {
        return query_value
          .split(",")
          .filter((item) => item)
          .map((item) => +item) as T;
      }
      break;
    case "boolean":
      if (query_value === "true" || query_value === "false") {
        return (query_value === "true") as T;
      } else if (query_value === "1" || query_value === "0") {
        return (query_value === "1") as T;
      }
      break;
    case "date": {
      const parsed = parse(query_value, DATE_FORMAT, new Date());
      if (isValid(parsed)) {
        return format(parsed, DATE_FORMAT) as T;
      }
      break;
    }
    case "datetime": {
      const parsed = parse(query_value, DATETIME_FORMAT, new Date());
      if (isValid(parsed)) {
        return format(parsed, DATETIME_FORMAT) as T;
      }
      break;
    }
    case "string":
      return query_value as T;
  }
  return vDefault;
};

export default useGetParam;
