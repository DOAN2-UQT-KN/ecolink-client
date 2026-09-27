import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { TbCheck, TbCopy, TbMailForward } from "react-icons/tb";

import showMessage, { MessageLevel, MessageType } from "@/utils/showMessage";

/**
 * Tells the applicant how to get back to the draft. The link was mailed when the code opened
 * it; the copy button covers a lost or slow email. The link is the only credential, so the
 * copy warns to keep it private.
 */
export const DraftLinkNotice = memo(function DraftLinkNotice({
  email,
}: {
  email: string;
}) {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      showMessage({
        type: MessageType.Toast,
        level: MessageLevel.Error,
        title: t("Could not copy, please copy the link from the address bar"),
      });
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-md border border-[rgba(136,122,71,0.35)] bg-[rgba(136,122,71,0.06)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <TbMailForward className="mt-0.5 size-5 shrink-0 text-button-accent" />
        <div className="text-sm">
          <p className="font-semibold">
            {t("Your draft is saved")}
          </p>
          <p className="text-foreground-tertiary">
            {t(
              "We emailed a link to {{email}} so you can come back to this draft (valid 180 days). Keep it private: anyone with the link can edit the draft.",
              { email },
            )}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-[rgba(136,122,71,0.5)] px-3 py-1.5 text-sm text-button-accent transition-colors hover:bg-[rgba(136,122,71,0.1)] sm:self-center cursor-pointer"
      >
        {isCopied ? <TbCheck className="size-4" /> : <TbCopy className="size-4" />}
        {isCopied ? t("Copied") : t("Copy link")}
      </button>
    </section>
  );
});

export default DraftLinkNotice;
