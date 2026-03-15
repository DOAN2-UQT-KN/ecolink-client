"use client";

import Image from "next/image";
import Link from "next/link";
import Logo from "./Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "../shared/DropdownMenu";
import { ArrowDown, ChevronDown, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";

const menuItems = [
  {
    label: "Homepage",
    href: "/",
  },
  {
    label: "Green map",
    href: "/green-map",
  },
  {
    label: "Community",
    href: "/community",
  },
  {
    label: "About us",
    href: "/about-us",
  },
];

const Header = () => {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language === "en" ? "EN" : "VN";
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 0);

      const maxScroll = 50;
      const progress = Math.min(scrollY / maxScroll, 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const renderMenuItemsDesktop = useMemo(
    () =>
      menuItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="
        hover:text-button-accent transition-colors duration-300 relative
        before:content-[''] before:absolute before:bottom-[-10px] before:left-0
        before:w-0 before:h-[1px] before:bg-button-accent
        before:transition-all before:duration-300
        hover:before:w-full
      "
        >
          {t(item.label)}
        </Link>
      )),
    [t],
  );

  const renderMenuItemsMobile = useMemo(
    () =>
      menuItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="hover:text-button-accent transition-colors duration-300"
        >
          {t(item.label)}
        </Link>
      )),
    [t],
  );

  const isLarge = useMediaQuery("(min-width: 1024px)");

  return (
    <>
      <header
        style={{
          width: `calc(90% + ${scrollProgress * 10}%)`,
          marginTop: `${16 * (1 - scrollProgress)}px`,
          borderRadius: `${40 * (1 - scrollProgress)}px`,
          borderWidth: `${1 * (1 - scrollProgress)}px`,
          borderColor: `rgba(0, 0, 0, ${1 - scrollProgress})`,
          borderStyle: "solid",
        }}
        className={`sticky top-0 z-50 flex flex-row justify-between items-center py-[10px] lg:py-[16px] px-4 lg:px-[70px] mx-auto ${
          isScrolled
            ? "bg-white/20 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="flex-shrink-0">
          <Logo size={isLarge ? "medium" : "small"} />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex flex-row justify-between px-[32px] py-[11px]  lg:font-display-3 font-semibold w-[613px]">
          {renderMenuItemsDesktop}
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex flex-row items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex flex-row items-center gap-1 hover:bg-zinc-100 p-2 rounded-full transition-all duration-300 cursor-pointer">
                {" "}
                {currentLang}
                <ChevronDown size={10} />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {currentLang === "VN" ? (
                <DropdownMenuItem onClick={() => i18n.changeLanguage("en")}>
                  EN
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => i18n.changeLanguage("vi")}>
                  VN
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
              <DropdownMenuItem>{t("Profile")}</DropdownMenuItem>
              <DropdownMenuItem>{t("Logout")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden p-2 text-zinc-800"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 lg:hidden ${
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[80vw] max-w-[300px] bg-white z-[70] transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col shadow-2xl ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-row items-center justify-between p-4 border-b">
          <Logo size="small" />
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-zinc-800 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col p-6 space-y-6 font-display-3 font-semibold overflow-y-auto">
          {renderMenuItemsMobile}
          <div className="h-[1px] bg-zinc-200 my-4" />

          {/* Mobile Language & Actions */}
          <div className="flex flex-col gap-4 text-base font-normal">
            <div className="flex flex-row items-center justify-between">
              <span className="text-zinc-500 uppercase">{t("Language")}:</span>
              <button
                onClick={() => {
                  i18n.changeLanguage(currentLang === "VN" ? "en" : "vi");
                }}
                className="px-3 py-1 bg-zinc-100 rounded-md text-sm font-semibold hover:bg-zinc-200 transition-colors"
              >
                {currentLang === "VN" ? t("Switch to EN") : t("Switch to VN")}
              </button>
            </div>

            <div className="flex flex-row items-center gap-3 mt-2 cursor-pointer p-2 hover:bg-zinc-50 rounded-md transition-colors">
              <Image src="/profile.png" alt="profile" width={30} height={30} />
              <span>{t("Profile")}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
