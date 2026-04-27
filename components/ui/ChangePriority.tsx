import { PRIORITY } from '@/constants/priority';
import { Dropdown, Tag, MenuProps } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TagPriorityProps {
  type: number;
  onChangePriority?: (value: number) => void;
  enabledDropdown?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ChangePriority: React.FC<TagPriorityProps> = ({
  type,
  onChangePriority,
  enabledDropdown = true,
  size = 'md',
}) => {
  const { t } = useTranslation();
  const [currentPriority, setCurrentPriority] = useState<number>(type);

  useEffect(() => {
    setCurrentPriority(type);
  }, [type]);

  const filterColorByType = useCallback((priority: number) => {
    switch (priority) {
      case PRIORITY.URGENT:
        return 'red';
      case PRIORITY.MEDIUM:
        return 'blue';
      case PRIORITY.LOW:
        return 'yellow';
      default:
        return 'default';
    }
  }, []);

  const renderNamePriority = useCallback(() => {
    switch (currentPriority) {
      case PRIORITY.URGENT:
        return t('Urgent');
      case PRIORITY.MEDIUM:
        return t('Medium');
      case PRIORITY.LOW:
        return t('Low');
      default:
        return '';
    }
  }, [currentPriority, t]);

  const priorityOptions = useMemo(
    () => [
      { label: t('Urgent'), value: PRIORITY.URGENT, color: '#F5222D' },
      { label: t('Medium'), value: PRIORITY.MEDIUM, color: '#1677FF' },
      { label: t('Low'), value: PRIORITY.LOW, color: '#FADB14' },
    ],
    [t],
  );

  const handleChangePriority = useCallback(
    (value: number) => {
      setCurrentPriority(value);
      onChangePriority?.(value);
    },
    [onChangePriority],
  );

  const handleMenuClick: MenuProps['onClick'] = useCallback(
    (e: any) => {
      handleChangePriority(Number(e.key));
    },
    [handleChangePriority],
  );

  const menuItems: MenuProps['items'] = useMemo(
    () =>
      priorityOptions.map((item) => ({
        key: String(item.value),
        label: (
          <div className="flex items-center justify-center">
            <span
              style={{
                backgroundColor: item.color,
                display: 'inline-block',
                // alignItems: 'center',
                textAlign: 'center',
              }}
            >
              {item.label}
            </span>
          </div>
        ),
      })),
    [priorityOptions],
  );

  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'min-w-16 py-0 text-xs';
      case 'lg':
        return 'min-w-32 py-1 text-base';
      case 'md':
      default:
        return 'min-w-24 pb-0.5 text-sm';
    }
  }, [size]);

  if (!enabledDropdown) {
    return (
      <Tag
        className={`text-center rounded-md mx-auto cursor-pointer ${sizeClasses}`}
        color={filterColorByType(currentPriority)}
      >
        {renderNamePriority()}
      </Tag>
    );
  }

  if (!currentPriority) return null;

  return (
    <Dropdown
      menu={{ items: menuItems, onClick: handleMenuClick }}
      trigger={['hover', 'click']}
      getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
    >
      <Tag
        className={`text-center rounded-md mx-auto cursor-pointer ${sizeClasses}`}
        color={filterColorByType(currentPriority)}
      >
        {renderNamePriority()}
      </Tag>
    </Dropdown>
  );
};

export default ChangePriority;
