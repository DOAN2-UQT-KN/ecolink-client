import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRIORITY } from '@/constants/priority';
import { cn } from '@/libs/utils';

export interface SelectListPriorityProps {
  value?: number | string;
  onChange?: (value: number) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const SelectListPriority: React.FC<SelectListPriorityProps> = ({
  value,
  onChange,
  disabled,
  className,
  placeholder,
}) => {
  const { t } = useTranslation();
  const options = useMemo(() => {
    return Object.entries(PRIORITY)
      .filter(([key]) => isNaN(Number(key)))
      .map(([key, value]) => {
        return {
          value: Number(value),
          label: t(key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()),
        };
      });
  }, [t]);

  return (
    <Select
      value={value !== undefined ? String(value) : undefined}
      onValueChange={(val) => onChange?.(Number(val))}
      disabled={disabled}
    >
      <SelectTrigger className={cn('w-full', className)}>
        <SelectValue placeholder={placeholder || t('Select priority')} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" />
              <span>{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SelectListPriority;
