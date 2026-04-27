import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image as AntdImage } from 'antd';
import { ICampaignTask } from '@/apis/campaign/models/campaignTask';
import { formattedDate } from '@/utils/formattedDate';
import ChangePriority from '@/components/ui/ChangePriority';
import { PRIORITY } from '@/constants/priority';
import {
  TbAlignLeft2,
  TbCalendarClock,
  TbChecklist,
  TbChevronDown,
  TbChevronUp,
  TbPencil,
  TbUrgent,
} from 'react-icons/tb';
import RichTextContent from '@/components/ui/RichTextContent';
import { parseScheduledTimeRange } from '@/utils/scheduledTimeRange';
import ChangeStatus from '@/components/ui/ChangeStatus';

export interface CampaignTaskCardProps {
  task: ICampaignTask;
  onEdit?: (task: ICampaignTask) => void;
  isOwner?: boolean;
}

export function CampaignTaskCard({ task, onEdit, isOwner }: CampaignTaskCardProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { scheduled_time_from, scheduled_time_to } = parseScheduledTimeRange(task.scheduled_time);
  const resultDescription = task.result?.description ?? '';
  const resultImages = task.result?.file ?? [];

  return (
    <div className="rounded-xl border border-[rgba(136,122,71,0.25)] bg-red-500 p-4 transition-all shadow-sm">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col gap-1 w-full">
          <span className="font-bold font-display-4 text-button-accent">
            {task.title || t('Untitled Task')}
          </span>
          <div className="flex justify-start gap-3 items-center w-full">
            <div className="font-display-1 text-foreground-tertiary flex items-center justify-center gap-1">
              <TbCalendarClock />
              {formattedDate(task.scheduled_date)}
            </div>
            <ChangeStatus type={task.status || 0} enabledDropdown={false} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isOwner && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              className="rounded-full hover:bg-button-accent/10 cursor-pointer text-button-accent transition-colors"
            >
              <TbPencil className="size-5" />
            </button>
          )}
          {isOpen ? (
            <button className="rounded-full hover:bg-button-accent/10 cursor-pointer text-button-accent transition-colors">
              <TbChevronUp className="size-5" />
            </button>
          ) : (
            <button className="rounded-full hover:bg-button-accent/10 cursor-pointer text-button-accent transition-colors">
              <TbChevronDown className="size-5" />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-[rgba(136,122,71,0.25)] flex flex-col gap-4 text-sm text-foreground-secondary bg-background-primary/80">
          <div className="flex flex-row gap-1 w-full">
            <div className="flex flex-col gap-5 w-2/3  border-r border-[rgba(136,122,71,0.25)] pr-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 font-semibold block text-foreground-tetiary uppercase font-display-1">
                  <TbAlignLeft2 className="size-4 shrink-0 text-button-accent" />
                  {t('Description')}
                </div>
                <RichTextContent
                  value={task.description || ''}
                  className="text-foreground whitespace-pre-wrap break-words !font-display-4"
                />
              </div>

              {(resultDescription || resultImages.length > 0) && (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 font-semibold block text-foreground-tetiary uppercase font-display-1">
                    <TbChecklist className="size-4 shrink-0 text-button-accent" />
                    {t('Result')}
                  </div>

                  {resultDescription && (
                    <RichTextContent
                      value={resultDescription}
                      className="text-foreground whitespace-pre-wrap break-words !font-display-4"
                    />
                  )}

                  {resultImages.length > 0 && (
                    <AntdImage.PreviewGroup>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 w-full overflow-hidden">
                        {resultImages.map((img, idx) => (
                          <div
                            key={img || idx}
                            className="relative aspect-[4/3] overflow-hidden  bg-muted group cursor-pointer"
                          >
                            <AntdImage
                              src={img}
                              alt={task.title || ''}
                              className="object-cover transition-transform duration-300 group-hover:scale-105 w-[220px] h-[220px]"
                              width="220px"
                              height="220px"
                            />
                          </div>
                        ))}
                      </div>
                    </AntdImage.PreviewGroup>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-5 w-1/3 pl-5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 font-semibold block text-foreground-tetiary uppercase font-display-1">
                  <TbCalendarClock className="size-4 shrink-0 text-button-accent " />
                  {t('Scheduled time')}
                </div>
                <p className="text-button-accent font-display-8 italic font-bold">
                  {scheduled_time_from}
                  {scheduled_time_to ? ` - ${scheduled_time_to}` : ''}
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 font-semibold block text-foreground-tetiary uppercase font-display-1">
                  <TbUrgent className="size-4 shrink-0 text-button-accent" />
                  {t('Priority')}
                </div>
                <div>
                  <ChangePriority type={task.priority || PRIORITY.MEDIUM} enabledDropdown={false} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CampaignTaskCard;
