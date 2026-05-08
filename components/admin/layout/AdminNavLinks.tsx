'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/libs/utils';
import {
  adminNavItems,
  type AdminNavGroupItem,
  type AdminNavItem,
} from '@/app/(pages)/(admin)/_config/adminNav';

function navLinkActive(pathname: string, href: string) {
  if (href === '/admin') {
    return pathname === '/admin' || pathname === '/admin/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function groupHasActiveChild(pathname: string, group: AdminNavGroupItem) {
  return group.children.some((c) => navLinkActive(pathname, c.href));
}

export function AdminNavLinks({
  collapsed,
  onNavigate,
  className,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const entry of adminNavItems) {
        if (entry.kind === 'group' && groupHasActiveChild(pathname, entry)) {
          next[entry.id] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  const linkClass = (active: boolean, opts?: { nested?: boolean }) =>
    cn(
      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
      'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      active && 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold',
      opts?.nested && 'py-2 pl-2',
      collapsed && !opts?.nested && 'justify-center px-2',
    );

  const renderEntry = (item: AdminNavItem) => {
    if (item.kind === 'link') {
      const Icon = item.icon;
      const active = navLinkActive(pathname, item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          title={collapsed ? t(item.labelKey) : undefined}
          className={linkClass(active)}
        >
          <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
          <span
            className={cn(
              'truncate transition-[opacity,width] duration-200',
              collapsed && 'sr-only w-0 overflow-hidden opacity-0',
            )}
          >
            {t(item.labelKey)}
          </span>
        </Link>
      );
    }

    const group = item;
    const Icon = group.icon;
    const childActive = groupHasActiveChild(pathname, group);
    const open = openGroups[group.id] ?? childActive;

    if (collapsed) {
      const first = group.children[0];
      return (
        <Link
          key={group.id}
          href={first.href}
          onClick={onNavigate}
          title={t(group.labelKey)}
          className={linkClass(childActive)}
        >
          <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
          <span className="sr-only w-0 overflow-hidden opacity-0">{t(group.labelKey)}</span>
        </Link>
      );
    }

    return (
      <div key={group.id} className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() =>
            setOpenGroups((prev) => ({
              ...prev,
              [group.id]: !open,
            }))
          }
          className={cn(
            linkClass(childActive),
            'w-full cursor-pointer border-0 bg-transparent text-left',
          )}
        >
          <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{t(group.labelKey)}</span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 opacity-70 transition-transform duration-200',
              open ? 'rotate-0' : '-rotate-90',
            )}
            aria-hidden
          />
        </button>
        {open ? (
          <div className="ml-5 flex flex-col gap-0.5 border-l border-sidebar-border pl-2">
            {group.children.map((child) => {
              const active = navLinkActive(pathname, child.href);
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={onNavigate}
                  className={linkClass(active, { nested: true })}
                >
                  <span className="truncate pl-4">{t(child.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <nav className={cn('flex flex-col gap-1 p-2', className)}>
      {adminNavItems.map((entry) => renderEntry(entry))}
    </nav>
  );
}
