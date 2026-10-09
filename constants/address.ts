export const DETAIL_ADDRESS_MAX_LENGTH = 255;

export const truncateDetailAddress = (value?: string | null): string => {
  const trimmed = value?.trim() ?? '';
  if (trimmed.length <= DETAIL_ADDRESS_MAX_LENGTH) {
    return trimmed;
  }
  return trimmed.slice(0, DETAIL_ADDRESS_MAX_LENGTH);
};
