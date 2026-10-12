import type { BreadcrumbItemProps } from '@/components/client/shared/Breadcrumbs';

/** Home › Campaigns › {title}, then `current`; without `current` the campaign is the page itself. */
export const campaignCrumbs = (
  campaignId: string,
  title: string,
  current?: BreadcrumbItemProps,
): BreadcrumbItemProps[] => [
  { label: 'Home', path: '/', type: 'link' },
  { label: 'Campaigns', path: '/campaigns', type: 'link' },
  { label: title, path: `/campaigns/${campaignId}`, type: current ? 'link' : 'page' },
  ...(current ? [current] : []),
];
