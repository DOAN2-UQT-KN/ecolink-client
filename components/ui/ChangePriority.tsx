import { PRIORITY } from '@/constants/priority';
import { PRIORITY_LABEL, PRIORITY_TONE } from '@/constants/statusTone';
import { cn } from '@/libs/utils';
import { Dropdown, MenuProps } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PILL_DOT, Pill } from './Pill';

interface TagPriorityProps {
  type: number;
  onChangePriority?: (value: number) => void;
  enabledDropdown?: boolean;
}

const ChangePriority: React.FC<TagPriorityProps> = ({
  type,
  onChangePriority,
  enabledDropdown = true,
}) => {
  const { t } = useTranslation();
  const [currentPriority, setCurrentPriority] = useState<number>(type);

  useEffect(() => {
    setCurrentPriority(type);
  }, [type]);

  const tone = PRIORITY_TONE[currentPriority as PRIORITY] ?? 'neutral';
  const label = PRIORITY_LABEL[currentPriority as PRIORITY];

  const handleMenuClick: MenuProps['onClick'] = useCallback(
    (e: { key: string }) => {
      const value = Number(e.key);
      setCurrentPriority(value);
      onChangePriority?.(value);
    },
    [onChangePriority],
  );

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      [PRIORITY.URGENT, PRIORITY.MEDIUM, PRIORITY.LOW].map((value) => ({
        key: String(value),
        label: (
          <div className="flex items-center gap-2">
            <span className={cn('inline-block size-2.5 rounded-full', PILL_DOT[PRIORITY_TONE[value]])} />
            <span>{t(PRIORITY_LABEL[value])}</span>
          </div>
        ),
      })),
    [t],
  );

  if (!enabledDropdown) {
    return <Pill tone={tone}>{label ? t(label) : ''}</Pill>;
  }

  if (!currentPriority) return null;

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      trigger={['hover', 'click']}
      getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
    >
      <Pill tone={tone} className="cursor-pointer">
        {label ? t(label) : ''}
      </Pill>
    </Dropdown>
  );
};

export default ChangePriority;
