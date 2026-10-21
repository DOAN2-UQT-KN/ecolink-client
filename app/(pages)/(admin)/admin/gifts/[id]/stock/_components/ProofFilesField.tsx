import { useEffect, useRef, useState, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { TbCloudUpload, TbFileTypePdf, TbTrash } from 'react-icons/tb';

import { TooltipTruncatedText } from '@/components/ui/TooltipTruncatedText';
import { cn } from '@/libs/utils';
import { MAX_PROOF_FILES, PROOF_FILE_ACCEPT } from '../_services/stockForm.service';

type Props = {
  files: File[];
  onAdd: (picked: FileList | null) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
  isDark: boolean;
};

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

function FileThumb({ file }: { file: File }) {
  const [src, setSrc] = useState<string | null>(null);
  const isImage = file.type.startsWith('image/');

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  if (isImage && src) {
    return <img src={src} alt="" className="size-10 shrink-0 rounded-md border border-border object-cover" />;
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600" aria-hidden>
      <TbFileTypePdf className="size-6" />
    </span>
  );
}

/** Proof files picked for a stock batch: preview list plus a click-or-drop zone (uploaded on save). */
export function ProofFilesField({ files, onAdd, onRemove, disabled, isDark }: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const full = files.length >= MAX_PROOF_FILES;

  const onDrop = (e: DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) onAdd(e.dataTransfer.files);
  };

  return (
    <div className="min-w-0 space-y-2">
      {files.length > 0 ? (
        <ul className="min-w-0 space-y-2" aria-label={t('Attached documents')}>
          {files.map((f, i) => {
            return (
              <li
                key={`${f.name}-${f.size}-${i}`}
                className={cn(
                  'flex min-w-0 items-center gap-3 rounded-lg border p-2',
                  isDark ? 'border-zinc-700 bg-zinc-800/50' : 'border-border bg-white',
                )}
              >
                <FileThumb file={f} />
                <div className="min-w-0 flex-1">
                  <TooltipTruncatedText text={f.name} maxLength={40} className="text-sm font-medium" />
                  <p className="text-xs text-foreground-secondary">
                    {f.type === 'application/pdf' ? 'PDF' : t('Image')} · {formatSize(f.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  disabled={disabled}
                  aria-label={t('Remove {{name}}', { name: f.name })}
                  title={t('Remove {{name}}', { name: f.name })}
                  className={cn(
                    'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
                    isDark ? 'text-zinc-400 hover:bg-red-500/15 hover:text-red-300' : 'text-zinc-500 hover:bg-red-50 hover:text-red-600',
                  )}
                >
                  <TbTrash className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={PROOF_FILE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          onAdd(e.target.files);
          e.target.value = '';
        }}
      />
      {full ? (
        <p className="text-xs text-foreground-secondary">{t('Maximum {{max}} files attached', { max: MAX_PROOF_FILES })}</p>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-4 text-center transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
            dragging
              ? 'border-button-accent bg-button-accent/5'
              : isDark
                ? 'border-zinc-600 hover:bg-zinc-800'
                : 'border-zinc-300 hover:bg-zinc-100',
          )}
        >
          <TbCloudUpload className="size-6 text-foreground-secondary" aria-hidden />
          <span className="text-sm font-medium">{t('Drop files here or click to choose')}</span>
          <span className="text-xs text-foreground-secondary">
            {t('Images or PDF, up to 10 MB each')} · {files.length}/{MAX_PROOF_FILES}
          </span>
        </button>
      )}
    </div>
  );
}
