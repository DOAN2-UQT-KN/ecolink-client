export interface ParsedScheduledTimeRange {
  scheduled_time_from: string;
  scheduled_time_to: string;
}

const formatTimeValue = (rawValue: string): string => {
  if (!rawValue) return '';

  if (rawValue.includes('T')) {
    const dateValue = new Date(rawValue);
    return `${String(dateValue.getHours()).padStart(2, '0')}:${String(dateValue.getMinutes()).padStart(2, '0')}`;
  }

  return rawValue.slice(0, 5);
};

export const parseScheduledTimeRange = (rawValue?: string): ParsedScheduledTimeRange => {
  if (!rawValue) return { scheduled_time_from: '', scheduled_time_to: '' };

  const [fromTime, toTime] = rawValue.split('-').map((value) => value.trim());
  const parsedFrom = formatTimeValue(fromTime || '');
  const parsedTo = formatTimeValue(toTime || '');

  if (parsedFrom && parsedTo) {
    return { scheduled_time_from: parsedFrom, scheduled_time_to: parsedTo };
  }

  return {
    scheduled_time_from: parsedFrom,
    scheduled_time_to: parsedTo || parsedFrom,
  };
};
