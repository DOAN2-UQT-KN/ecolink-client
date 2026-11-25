import { useTranslation } from "react-i18next";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GridCellDetail } from "./GridCellDetail";

export function GridCellDetailDialog({
  cellKey,
  onClose,
}: {
  cellKey: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={cellKey !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t("Grid cell")} <span className="font-mono">{cellKey}</span>
          </DialogTitle>
        </DialogHeader>
        {cellKey ? <GridCellDetail cellKey={cellKey} /> : null}
      </DialogContent>
    </Dialog>
  );
}
