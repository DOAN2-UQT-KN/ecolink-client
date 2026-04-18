"use client";

import { useMediaQuery } from "@/hooks/useMediaQuery";
import Logo from "./Logo";
import { useTranslation } from "react-i18next";
import { FaInstagram } from "react-icons/fa";
import { HiOutlinePhone, HiOutlineMail } from "react-icons/hi";
import { Divider } from "../shared/Divider";

const Footer = () => {
  const isMedium = useMediaQuery("(min-width: 768px)");
  const { t } = useTranslation();

  return (
    <footer className="flex flex-col items-center justify-center gap-[15px] pb-[70px]">
      <Divider className="text-background-tertiary mb-15" />
      {isMedium ? <Logo size="medium" /> : <Logo size="small" />}
      <span className="font-display text-[12px]  text-foreground-secondary">
        {t("Link for a Cleaner Tomorrow")}
      </span>
      <span className="text-center font-display-1 text-foreground-tertiary">
        {t("© 2026 EcoLink. All rights reserved.")}
      </span>
      <div className="flex flex-row items-center justify-center gap-[8px] text-foreground-tertiary">
        <FaInstagram size={24} />
        <HiOutlineMail size={28} />
        <HiOutlinePhone size={24} />
      </div>
    </footer>
  );
};

export default Footer;
