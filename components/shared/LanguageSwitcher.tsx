"use client";

import { useTranslation } from "react-i18next";
import Image from "next/image";

interface LanguageSwitcherProps {
  showName?: boolean;
}

const LanguageSwitcher = ({ showName = false }: LanguageSwitcherProps) => {
  const { i18n } = useTranslation();

  const currentLang = i18n.language.split("-")[0];

  const nextLang = currentLang === "vi" ? "en" : "vi";

  const handleChange = () => {
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={handleChange}
      className={`flex items-center justify-center hover:cursor-pointer transition-all duration-200 ${
        showName
          ? "gap-2 px-3 py-1.5 rounded-full hover:bg-zinc-100"
          : "w-8 h-8 rounded-full overflow-hidden"
      }`}
      title={nextLang === "en" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
    >
      <div
        className={`${
          showName ? "w-6 h-6" : "w-full h-full"
        } rounded-full overflow-hidden flex-shrink-0`}
      >
        <Image
          src={nextLang === "en" ? "/england.webp" : "/vietnam.webp"}
          alt={nextLang === "en" ? "English" : "Tiếng Việt"}
          width={32}
          height={32}
          className="w-full h-full object-cover"
        />
      </div>
      {showName && (
        <span className="text-xs font-medium text-zinc-500">
          {nextLang === "en" ? "EN" : "VN"}
        </span>
      )}
    </button>
  );
};

export default LanguageSwitcher;
