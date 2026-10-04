import { memo } from 'react';

import ScheduleFields from './ScheduleFields';
import ContactAndSafety from './ContactAndSafety';

/** Step 2: when it happens, who to contact, and what volunteers should know. */
const StepSchedule = memo(function StepSchedule() {
  return (
    <div className="flex flex-col gap-[20px]">
      <ScheduleFields />
      <ContactAndSafety />
    </div>
  );
});

export default StepSchedule;
