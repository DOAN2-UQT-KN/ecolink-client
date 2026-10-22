import { useTranslation } from 'react-i18next';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/libs/utils';
import { CARRIER_SUGGESTIONS, OTHER_CARRIER } from '../_config/carriers';

export interface SelectListCarrierProps {
  /** A suggested carrier, OTHER_CARRIER, or '' when nothing is picked yet. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
}

/** Carrier picker: the common carriers plus "Other" (the dialog then asks for the name). */
export function SelectListCarrier({ value, onChange, disabled, invalid, id, className }: SelectListCarrierProps) {
  const { t } = useTranslation();
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} aria-invalid={invalid} className={cn('!h-10 w-full !border !border-zinc-300', className)}>
        <SelectValue placeholder={t('Select a carrier')} />
      </SelectTrigger>
      <SelectContent>
        {CARRIER_SUGGESTIONS.map((carrier) => (
          <SelectItem key={carrier} value={carrier}>
            {carrier}
          </SelectItem>
        ))}
        <SelectItem value={OTHER_CARRIER}>{t('Other carrier')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
