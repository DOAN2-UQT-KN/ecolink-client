import { queryClient } from '@/libs/queryClient';

// Called from onSuccess on purpose: usePost's `queryKey` would also refresh after a failure.
export const refreshCampaign = (id: string) => {
  void queryClient.invalidateQueries({ queryKey: ['campaign', id] });
};

export const refreshRegistrationOptions = () => {
  void queryClient.invalidateQueries({ queryKey: ['campaign-registration-options'] });
};

export const refreshShiftOverview = (id: string) => {
  void queryClient.invalidateQueries({ queryKey: ['shift-overview', id] });
};
