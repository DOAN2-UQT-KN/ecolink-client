'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '../shared/DropdownMenu';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { GoArrowUpRight } from 'react-icons/go';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import Logo from './Logo';
import LanguageSwitcher from '../shared/LanguageSwitcher';
import SpotlightCard from '../shared/SpotlightCard';
import useAuthStore from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';
import { clearAuthStorage } from '@/utils/logout';

type CardNavLink = {
  label: string;
  href: string;
  ariaLabel: string;
};

export type CardNavItem = {
  label: string;
  bgColor: string;
  textColor: string;
  links: CardNavLink[];
};

export interface CardNavProps {
  ease?: string;
  menuColor?: string;
}

const items = [
  {
    label: 'EcoLink',
    bgColor: '#0D0716',
    textColor: '#fff',
    links: [
      {
        label: 'About Us',
        ariaLabel: 'About EcoLink',
        href: '/about',
      },
      {
        label: 'Our Mission',
        ariaLabel: 'EcoLink Mission',
        href: '/mission',
      },
      {
        label: 'Store',
        ariaLabel: 'Store',
        href: '/gifts',
      },
    ],
  },
  {
    label: 'Community',
    bgColor: '#170D27',
    textColor: '#fff',
    links: [
      {
        label: 'Join Campaigns',
        ariaLabel: 'Join Environmental Campaigns',
        href: '/campaigns',
      },
      {
        label: 'Report Trash',
        ariaLabel: 'Report Trash',
        href: '/incidents',
      },
      {
        label: 'Join Organizations',
        ariaLabel: 'Join Organizations',
        href: '/organizations',
      },
    ],
  },
  {
    label: 'Manage',
    bgColor: '#271E37',
    textColor: '#fff',
    links: [
      {
        label: 'My Campaigns',
        ariaLabel: 'My Campaigns',
        href: '/campaigns/me',
      },
      {
        label: 'My Reports',
        ariaLabel: 'My Reports',
        href: '/incidents/me',
      },
      {
        label: 'My Organizations',
        ariaLabel: 'My Organizations',
        href: '/organizations/me',
      },
    ],
  },
  {
    label: 'Contact',
    bgColor: '#33244A',
    textColor: '#fff',
    links: [
      {
        label: 'Email',
        ariaLabel: 'Contact EcoLink via Email',
        href: 'mailto:hello@ecolink.com',
      },
      {
        label: 'Partnership',
        ariaLabel: 'EcoLink Partnership',
        href: '/partnership',
      },
      {
        label: 'Support',
        ariaLabel: 'EcoLink Support',
        href: '/support',
      },
    ],
  },
];

const Header: React.FC<CardNavProps> = ({ ease = 'power3.out', menuColor }) => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const navRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const { user, setLogoutSuccess } = useAuthStore();
  // console.log(user);
  const router = useRouter();

  const calculateHeight = () => {
    const navEl = navRef.current;
    if (!navEl) return 260;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) {
      const contentEl = navEl.querySelector('.card-nav-content') as HTMLElement;
      if (contentEl) {
        const wasVisible = contentEl.style.visibility;
        const wasPointerEvents = contentEl.style.pointerEvents;
        const wasPosition = contentEl.style.position;
        const wasHeight = contentEl.style.height;

        contentEl.style.visibility = 'visible';
        contentEl.style.pointerEvents = 'auto';
        contentEl.style.position = 'static';
        contentEl.style.height = 'auto';

        contentEl.offsetHeight;

        const topBar = 60;
        const padding = 16;
        const contentHeight = contentEl.scrollHeight;

        contentEl.style.visibility = wasVisible;
        contentEl.style.pointerEvents = wasPointerEvents;
        contentEl.style.position = wasPosition;
        contentEl.style.height = wasHeight;

        const totalHeight = topBar + contentHeight + padding;
        const maxHeight = typeof window !== 'undefined' ? window.innerHeight - 20 : totalHeight;
        return Math.min(totalHeight, maxHeight);
      }
    }
    return 260;
  };

  const createTimeline = () => {
    const navEl = navRef.current;
    if (!navEl) return null;

    gsap.set(navEl, { height: 60, overflow: 'hidden' });
    gsap.set(cardsRef.current, { y: 50, opacity: 0 });

    const tl = gsap.timeline({ paused: true });

    tl.to(navEl, {
      height: calculateHeight,
      duration: 0.4,
      ease,
    });

    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease, stagger: 0.08 }, '-=0.1');

    return tl;
  };

  useLayoutEffect(() => {
    const tl = createTimeline();
    tlRef.current = tl;

    return () => {
      tl?.kill();
      tlRef.current = null;
    };
  }, [ease, items]);

  useLayoutEffect(() => {
    const handleResize = () => {
      if (!tlRef.current) return;

      if (isExpanded) {
        const newHeight = calculateHeight();
        gsap.set(navRef.current, { height: newHeight });

        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          newTl.progress(1);
          tlRef.current = newTl;
        }
      } else {
        tlRef.current.kill();
        const newTl = createTimeline();
        if (newTl) {
          tlRef.current = newTl;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  const toggleMenu = () => {
    const tl = tlRef.current;
    if (!tl) return;
    if (!isExpanded) {
      setIsHamburgerOpen(true);
      setIsExpanded(true);
      tl.play(0);
    } else {
      setIsHamburgerOpen(false);
      tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
      tl.reverse();
    }
  };

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el;
  };

  const isLarge = useMediaQuery('(min-width: 1024px)');
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && navRef.current && !navRef.current.contains(event.target as Node)) {
        const tl = tlRef.current;
        if (tl) {
          setIsHamburgerOpen(false);
          tl.eventCallback('onReverseComplete', () => setIsExpanded(false));
          tl.reverse();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const renderHamburgerMenu = () => (
    <div
      className={`hamburger-menu ${
        isHamburgerOpen ? 'open' : ''
      } group h-full flex flex-col items-center justify-center cursor-pointer gap-[6px] order-2 md:order-none`}
      onClick={toggleMenu}
      role="button"
      aria-label={isExpanded ? t('Close menu') : t('Open menu')}
      suppressHydrationWarning
      tabIndex={0}
      style={{ color: menuColor || '#000' }}
    >
      <div
        className={`hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] ${
          isHamburgerOpen ? 'translate-y-[4px] rotate-45' : ''
        } group-hover:opacity-75`}
      />
      <div
        className={`hamburger-line w-[30px] h-[2px] bg-current transition-[transform,opacity,margin] duration-300 ease-linear [transform-origin:50%_50%] ${
          isHamburgerOpen ? '-translate-y-[4px] -rotate-45' : ''
        } group-hover:opacity-75`}
      />
    </div>
  );

  const renderLogo = () => (
    <div className="logo-container flex items-center md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 order-1 md:order-none">
      <Logo size={isLarge ? 'medium' : 'small'} />
    </div>
  );

  const renderUserActions = (isMobile?: boolean) => (
    <div
      className={`card-nav-cta-button border-0 rounded-[calc(0.75rem-0.2rem)] items-center font-medium cursor-pointer transition-colors duration-300 gap-1 ${
        isMobile
          ? 'flex md:hidden w-full justify-center gap-6 py-2 lg:py-4 bg-white/40 backdrop-blur-xl border border-white/50 text-black rounded-2xl md:mt-auto'
          : 'hidden md:inline-flex h-full px-4'
      }`}
    >
      <LanguageSwitcher />

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Image
              src="/profile.png"
              alt="profile"
              width={35}
              height={30}
              className="cursor-pointer"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link href="/profile/points">{t('Profile')}</Link>
            </DropdownMenuItem>
            {(user as any).role_id === '11111111-1111-1111-1111-111111111111' && (
              <DropdownMenuItem asChild>
                <Link href="/admin">{t('Admin')}</Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
                clearAuthStorage();
                setLogoutSuccess();
                router.push('/authenticate');
              }}
            >
              {t('Logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Image
          src="/profile.png"
          alt="profile"
          width={35}
          height={30}
          className="cursor-pointer"
          onClick={() => router.push('/authenticate')}
        />
      )}
    </div>
  );

  const renderNavContent = () => (
    <div
      className={`card-nav-content absolute left-0 right-0 top-[60px] bottom-0 p-2 flex flex-col items-stretch gap-2 justify-start z-[1] ${
        isExpanded ? 'visible pointer-events-auto' : 'invisible pointer-events-none'
      } md:flex-row md:items-end md:gap-[12px] overflow-y-auto`}
      aria-hidden={!isExpanded}
    >
      {(items || []).slice(0, 3).map((item, idx) => (
        <SpotlightCard
          key={idx}
          spotlightColor="rgba(151, 175, 97, 0.3)"
          className="nav-card select-none relative flex flex-col gap-2 p-[12px_12px] lg:p-[20px_16px] rounded-[calc(0.75rem-0.2rem)] min-w-0 flex-[1_1_auto] h-auto md:min-h-[60px] md:h-full md:min-h-0 md:flex-[1_1_0%] bg-white/40 rounded-2xl backdrop-blur-xl border border-white/50 text-black"
        >
          <div className="nav-card-label tracking-[-0.5px] text-[16px] md:text-[22px] font-display-5 font-semibold">
            {t(item.label)}
          </div>
          <div className="nav-card-links mt-auto flex flex-col gap-0 md:gap-[4px]">
            {item.links?.map((lnk, i) => (
              <a
                key={`${lnk.label}-${i}`}
                className="
                  hover:text-button-accent transition-colors duration-300 relative
                  before:content-[''] before:absolute before:bottom-[-2px] before:left-0
                  before:w-0 before:h-[1px] before:bg-button-accent
                  before:transition-all before:duration-300
                  hover:before:w-full flex flex-row items-center gap-1 w-fit hover:cursor-pointer font-display-1 md:font-display-3
                "
                href={lnk.href}
                aria-label={t(lnk.ariaLabel)}
              >
                <GoArrowUpRight className="nav-card-link-icon shrink-0" aria-hidden="true" />
                {t(lnk.label)}
              </a>
            ))}
          </div>
        </SpotlightCard>
      ))}
      {renderUserActions(true)}
    </div>
  );

  return (
    <header
      className={`sticky top-0 z-50 flex flex-row justify-between items-center py-[10px] lg:py-[5px] px-4 lg:px-[70px] mx-auto`}
    >
      <div
        className={`card-nav-container absolute left-1/2 -translate-x-1/2 w-[80%] z-[99] top-[1.2em] md:top-[1em] bg-transparent `}
      >
        <nav
          ref={navRef}
          className={`card-nav ${
            isExpanded ? 'open' : ''
          } block h-[60px] p-0 rounded-xl relative overflow-hidden will-change-[height] border border-1 border-black ${
            isScrolled || isExpanded
              ? 'bg-white/20 backdrop-blur-lg shadow-sm'
              : 'bg-background-primary'
          }`}
        >
          <div className="card-nav-top absolute inset-x-0 top-0 h-[60px] flex items-center justify-between p-2 pl-[1.1rem] z-[2]">
            {renderHamburgerMenu()}
            {renderLogo()}
            {renderUserActions(false)}
          </div>

          {renderNavContent()}
        </nav>
      </div>
    </header>
  );
};

export default Header;
