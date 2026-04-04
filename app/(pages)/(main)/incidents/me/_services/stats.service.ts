import { IIncident } from "@/apis/incident/models/incident";
import { STATUS } from "@/constants/status";

export interface IncidentStats {
  total: number;
  resolved: number;
  pending: number;
}

export const calculateIncidentStats = (reports: IIncident[]): IncidentStats => {
  const total = reports.length;
  const resolved = reports.filter(
    (report) =>
      report.status === STATUS.COMPLETED ||
      report.status === STATUS.APPROVED ||
      report.status === STATUS.CLOSED,
  ).length;
  const pending = total - resolved;

  return { total, resolved, pending };
};
