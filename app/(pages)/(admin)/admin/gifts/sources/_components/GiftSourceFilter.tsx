import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbZoom } from 'react-icons/tb';

import type { IGetGiftSourcesRequest } from '@/apis/gift-source/models/giftSource';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebounce } from '@/hooks/useDebounce';
import { GIFT_SOURCE_TYPE_LABEL, GIFT_SOURCE_TYPES } from '../_services/giftSourceForm.service';

const ALL = 'all';

type Props = {
  request: IGetGiftSourcesRequest;
  onChange: (key: 'type' | 'status' | 'search', value: string | undefined) => void;
};

export function GiftSourceFilter({ request, onChange }: Props) {
  const { t } = useTranslation();
  const [search, setSearch] = useState(request.search ?? '');
  const debounced = useDebounce(search, 500);

  useEffect(() => {
    const next = debounced.trim() || undefined;
    if (next !== request.search) onChange('search', next);
  }, [debounced, onChange, request.search]);

  const triggerClass = '!h-10 w-full !border !border-input';

  return (
    <div className="grid grid-cols-1 gap-4 rounded-[10px] border border-border bg-card p-4 md:grid-cols-3">
      <Field>
        <FieldLabel htmlFor="source-search" className="text-sm font-medium text-foreground-secondary">
          {t('Search')}
        </FieldLabel>
        <div className="relative">
          <TbZoom className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="source-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Source name...')}
            className="h-10 pl-9"
          />
        </div>
      </Field>
      <Field>
        <FieldLabel className="text-sm font-medium text-foreground-secondary">{t('Source type')}</FieldLabel>
        <Select value={request.type ?? ALL} onValueChange={(v) => onChange('type', v === ALL ? undefined : v)}>
          <SelectTrigger className={triggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('All')}</SelectItem>
            {GIFT_SOURCE_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(GIFT_SOURCE_TYPE_LABEL[type])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel className="text-sm font-medium text-foreground-secondary">{t('Status')}</FieldLabel>
        <Select value={request.status ?? ALL} onValueChange={(v) => onChange('status', v === ALL ? undefined : v)}>
          <SelectTrigger className={triggerClass}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t('All')}</SelectItem>
            <SelectItem value="ACTIVE">{t('Partnering')}</SelectItem>
            <SelectItem value="INACTIVE">{t('Stopped')}</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
