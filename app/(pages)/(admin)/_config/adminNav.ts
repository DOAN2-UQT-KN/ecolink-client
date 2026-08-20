import {
  TbUsersGroup,
  TbMessageReport,
  TbLayoutDashboard,
  TbSettings,
  TbGift,
  TbFlag,
  TbUser,
} from 'react-icons/tb';
import { IconType } from 'react-icons';

export type AdminNavLinkItem = {
  kind: 'link';
  href: string;
  /** i18n key in common.json */
  labelKey: string;
  icon: IconType;
};

export type AdminNavGroupItem = {
  kind: 'group';
  /** Stable key for open/collapsed state */
  id: string;
  labelKey: string;
  icon: IconType;
  children: { href: string; labelKey: string }[];
};

export type AdminNavItem = AdminNavLinkItem | AdminNavGroupItem;

export const adminNavItems: AdminNavItem[] = [
  {
    kind: 'link',
    href: '/admin',
    labelKey: 'Admin dashboard',
    icon: TbLayoutDashboard,
  },
  {
    kind: 'link',
    href: '/admin/incidents',
    labelKey: 'Incidents',
    icon: TbMessageReport,
  },
  {
    kind: 'link',
    href: '/admin/organizations',
    labelKey: 'Organizations',
    icon: TbUsersGroup,
  },
  {
    kind: 'link',
    href: '/admin/users',
    labelKey: 'Users',
    icon: TbUser,
  },
  { kind: 'link', href: '/admin/campaigns', labelKey: 'Campaigns', icon: TbFlag },
  { kind: 'link', href: '/admin/gifts', labelKey: 'Gifts', icon: TbGift },
  { kind: 'link', href: '/admin/settings', labelKey: 'Settings', icon: TbSettings },
];
