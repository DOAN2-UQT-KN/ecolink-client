import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HiChevronDown, HiChevronUp, HiPencil } from "react-icons/hi";
import { ICampaignTask } from "@/apis/campaign/models/campaignTask";
import { formattedDate } from "@/utils/formattedDate";

export interface CampaignTaskCardProps {
  task: ICampaignTask;
  onEdit?: (task: ICampaignTask) => void;
  isOwner?: boolean;
}

export function CampaignTaskCard({ task, onEdit, isOwner }: CampaignTaskCardProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-xl border border-[rgba(136,122,71,0.25)] bg-white/80 p-4 transition-all shadow-sm">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col gap-1">
          <span className="font-semibold font-display-4 text-foreground">
            {task.title || task.name || t("Untitled Task")}
          </span>
          <span className="text-sm text-foreground-tertiary">
            {t("Scheduled")}: {formattedDate(task.scheduled_time)}
          </span>
          <span className="text-sm text-foreground-tertiary">
            {t("Priority")}: {task.priority ?? t("Not set")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isOwner && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="p-2 rounded-full hover:bg-black/5 text-foreground-secondary transition-colors"
            >
              <HiPencil className="size-4" />
            </button>
          )}
          {isOpen ? <HiChevronUp className="size-5" /> : <HiChevronDown className="size-5" />}
        </div>
      </div>
      
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[rgba(136,122,71,0.25)] flex flex-col gap-3 text-sm text-foreground-secondary">
          <div>
            <span className="font-semibold block text-foreground">{t("Title")}</span>
            <p>{task.title || task.name}</p>
          </div>
          <div>
            <span className="font-semibold block text-foreground">{t("Description")}</span>
            <p className="whitespace-pre-wrap">{task.description}</p>
          </div>
          {task.result && (
            <div>
              <span className="font-semibold block text-foreground">{t("Result")}</span>
              <p className="whitespace-pre-wrap">{task.result}</p>
            </div>
          )}
          <div>
            <span className="font-semibold block text-foreground">{t("Scheduled time")}</span>
            <p>{formattedDate(task.scheduled_time)}</p>
          </div>
          <div>
            <span className="font-semibold block text-foreground">{t("Priority")}</span>
            <p>{task.priority ?? t("Not set")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignTaskCard;
