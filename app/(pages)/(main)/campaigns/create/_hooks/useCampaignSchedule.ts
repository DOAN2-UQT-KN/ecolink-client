import { useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
  dropScheduleColumn,
  dropScheduleRow,
  fitSchedule,
  type CampaignFormValues,
} from '../_services/campaign.service';

/**
 * Keeps the day × meeting point grid in step with the days and meeting points lists. Each runs
 * after the days / meeting points list already changed.
 */
export function useCampaignSchedule(form: UseFormReturn<CampaignFormValues>, currentUserId: string) {
  /** Replaces the grid with `grid` fitted to the current days × meeting points. */
  const setFitted = useCallback(
    (grid: CampaignFormValues['schedule'] | undefined) => {
      const values = form.getValues();
      form.setValue(
        'schedule',
        fitSchedule(grid, values.days.length, values.meeting_points.length, currentUserId),
        { shouldDirty: true },
      );
    },
    [currentUserId, form],
  );

  // Adding a day or a point: fitting the grid pads the new row / column with empty shifts.
  const addScheduleRow = useCallback(() => setFitted(form.getValues().schedule), [form, setFitted]);
  const removeScheduleRow = useCallback(
    (dayIndex: number) => setFitted(dropScheduleRow(form.getValues().schedule, dayIndex)),
    [form, setFitted],
  );
  const addScheduleColumn = addScheduleRow;
  const removeScheduleColumn = useCallback(
    (pointIndex: number) => setFitted(dropScheduleColumn(form.getValues().schedule, pointIndex)),
    [form, setFitted],
  );

  return { addScheduleRow, removeScheduleRow, addScheduleColumn, removeScheduleColumn };
}
