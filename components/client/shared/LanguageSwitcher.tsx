import { useTranslation } from "react-i18next";
import Image from "@/components/ui/AppImage";
import { useEffect, useState } from "react";

import { I18N_STORAGE_KEY } from "@/constants/i18n";
import { useQueryClient } from "@tanstack/react-query";

interface LanguageSwitcherProps {
  showName?: boolean;
}

const LanguageSwitcher = ({ showName = false }: LanguageSwitcherProps) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentLang = i18n.language.split("-")[0];
  const nextLang = currentLang === "vi" ? "en" : "vi";

  const handleChange = () => {
    localStorage.setItem(I18N_STORAGE_KEY, nextLang);
    void i18n.changeLanguage(nextLang).then(() => {
      void queryClient.invalidateQueries();
    });
  };

  if (!mounted) {
    return (
      <button
        className={`flex items-center justify-center hover:cursor-pointer transition-all duration-200 ${
          showName
            ? "gap-2 px-3 py-1.5 rounded-full hover:bg-zinc-100"
            : "w-8 h-8 rounded-full overflow-hidden"
        }`}
        aria-label={t("Switch language")}
      >
        <div
          className={`${
            showName ? "w-6 h-6" : "w-full h-full"
          } rounded-full overflow-hidden flex-shrink-0`}
        />
      </button>
    );
  }

  return (
    <button
      onClick={handleChange}
      className={`flex items-center justify-center hover:cursor-pointer transition-all duration-200 ${
        showName
          ? "gap-2 px-3 py-1.5 rounded-full hover:bg-zinc-100"
          : "w-8 h-8 rounded-full overflow-hidden"
      }`}
      title={t(nextLang === "en" ? "Switch to EN" : "Switch to VN")}
    >
      <div
        className={`${
          showName ? "w-6 h-6" : "w-full h-full"
        } rounded-full overflow-hidden flex-shrink-0`}
      >
        <Image
          src={nextLang === "en" ? "/england.webp" : "/vietnam.webp"}
          alt={t(nextLang === "en" ? "Switch to EN" : "Switch to VN")}
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
