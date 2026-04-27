"use client";

import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetCampaignTasks } from "@/apis/campaign/campaignTask";
import { ICampaignTask } from "@/apis/campaign/models/campaignTask";
import { useCampaignDetail } from "../_hooks/useCampaignDetail";
import { Button } from "@/components/client/shared/Button";
import { CampaignTaskCard } from "@/components/client/shared/CampaignTaskCard";
import PopoverCreateUpdateTask from "@/components/client/shared/PopoverCreateUpdateTask";

export const CampaignTask = memo(function CampaignTask() {
  const { t } = useTranslation("common");
  const { campaignId, isCampaignOwner } = useCampaignDetail();

  const { data: tasksData, refetch } = useGetCampaignTasks(
    { campaignId: campaignId! },
    { enabled: !!campaignId }
  );

  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ICampaignTask | undefined>(undefined);

  const handleCreate = () => {
    setEditingTask(undefined);
    setIsPopoverOpen(true);
  };

  const handleEdit = (task: ICampaignTask) => {
    setEditingTask(task);
    setIsPopoverOpen(true);
  };

  const tasks = tasksData?.data?.tasks || [];

  return (
    <div className="rounded-xl border border-[rgba(136,122,71,0.4)] bg-white/60 p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display-6 font-semibold text-button-accent">
          {t("Tasks")}
        </h3>
        {isCampaignOwner && (
          <Button onClick={handleCreate} size="small" variant="brown">
            {t("Add task")}
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <CampaignTaskCard
            key={task.id}
            task={task}
            isOwner={isCampaignOwner}
            onEdit={handleEdit}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-6 text-foreground-tertiary">
            {t("No tasks found")}
          </div>
        )}
      </div>

      {isPopoverOpen && campaignId && (
        <PopoverCreateUpdateTask
          open={isPopoverOpen}
          onClose={() => setIsPopoverOpen(false)}
          task={editingTask}
          campaignId={campaignId}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
});
