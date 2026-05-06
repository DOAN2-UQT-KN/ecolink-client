'use client';

import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/libs/utils';

import {
  AGG_OPTIONS,
  type AggOp,
  type CompareOperator,
  type LogicalOperator,
  MAX_RULE_NEST_DEPTH,
  maxBranchGroupDepth,
  type RuleGroup,
  type RuleLeaf,
  RULE_TARGETS,
  OPERATOR_OPTIONS,
  type RuleTargetId,
  TARGET_FIELD_PRESETS,
  TARGET_LABEL,
  addLeafAt,
  addNestedGroupAt,
  addRootGroup,
  addRootLeaf,
  isRuleTargetId,
  normalizeRuleGroup,
  removeConditionAt,
  serializeRuleTreeLive,
  updateGroupOperatorAt,
  updateLeafAt,
  updateRootOperator,
} from '../_services/badgeRulesAst';

export interface BadgeRulesBuilderProps {
  value: Record<string, unknown> | null;
  onChange: (next: Record<string, unknown> | null) => void;
  disabled?: boolean;
  isDark?: boolean;
}

function Separator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-3 select-none" aria-hidden>
      <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-600" />
      <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
      <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-600" />
    </div>
  );
}

type LeafRowProps = {
  path: number[];
  leaf: RuleLeaf;
  disabled?: boolean;
  isDark?: boolean;
  onUpdate: (patch: Partial<RuleLeaf>) => void;
  onRemove: () => void;
};

const LeafConditionRow = memo(function LeafConditionRow({
  path,
  leaf,
  disabled,
  isDark,
  onUpdate,
  onRemove,
}: LeafRowProps) {
  const { t } = useTranslation();
  const presets =
    isRuleTargetId(leaf.target) ? TARGET_FIELD_PRESETS[leaf.target] : [];
  const datalistId = `badge-rule-field-${path.join('-') || 'root'}`;

  return (
    <div
      className={cn(
        'flex flex-wrap items-end gap-2 rounded-md border p-2',
        isDark ? 'border-zinc-700 bg-zinc-950/80' : 'border-zinc-200 bg-white',
      )}
    >
      <div className="flex shrink-0 items-center gap-1 text-zinc-400 pt-2">
        <GripVertical className="size-4" aria-hidden />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6 flex-1 min-w-0">
        <div className="sm:col-span-1">
          <span className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">
            {t('Table')}
          </span>
          <Select
            value={leaf.target}
            onValueChange={(v) => onUpdate({ target: v })}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 text-xs !border-zinc-300 dark:!border-zinc-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RULE_TARGETS.map((id) => (
                <SelectItem key={id} value={id} className="text-xs">
                  {t(TARGET_LABEL[id])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-1">
          <span className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">
            {t('Agg')}
          </span>
          <Select
            value={leaf.agg}
            onValueChange={(v) => onUpdate({ agg: v as AggOp })}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 text-xs !border-zinc-300 dark:!border-zinc-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AGG_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <span className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">
            {t('Field')}
          </span>
          <Input
            className="h-9 font-mono text-xs !border-zinc-300 dark:!border-zinc-600"
            value={leaf.field}
            onChange={(e) => onUpdate({ field: e.target.value })}
            placeholder="id"
            disabled={disabled}
            list={presets.length > 0 ? datalistId : undefined}
          />
          {presets.length > 0 ? (
            <datalist id={datalistId}>
              {presets.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          ) : null}
        </div>
        <div className="sm:col-span-1">
          <span className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">
            {t('Op')}
          </span>
          <Select
            value={leaf.operator}
            onValueChange={(v) => onUpdate({ operator: v as CompareOperator })}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 text-xs !border-zinc-300 dark:!border-zinc-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATOR_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <span className="mb-1 block text-[10px] font-medium uppercase text-muted-foreground">
            {t('Value')}
          </span>
          <Input
            type="number"
            className="h-9 text-xs !border-zinc-300 dark:!border-zinc-600"
            value={Number.isFinite(leaf.value) ? leaf.value : 0}
            onChange={(e) => {
              const n = Number(e.target.value);
              onUpdate({ value: Number.isFinite(n) ? n : 0 });
            }}
            disabled={disabled}
          />
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 h-9 w-9 text-zinc-500 hover:text-destructive"
        disabled={disabled}
        onClick={onRemove}
        aria-label={`Remove condition ${path.join('-')}`}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
});

type GroupCardProps = {
  group: RuleGroup;
  pathToSelf: number[];
  disabled?: boolean;
  isDark?: boolean;
  canNestMore: boolean;
  onCommit: (next: RuleGroup) => void;
  rootDraft: RuleGroup;
};

const RulesGroupCard = memo(function RulesGroupCard({
  group,
  pathToSelf,
  disabled,
  isDark,
  canNestMore,
  onCommit,
  rootDraft,
}: GroupCardProps) {
  const { t } = useTranslation();

  const setGroupOp = useCallback(
    (op: LogicalOperator) => {
      onCommit(updateGroupOperatorAt(rootDraft, pathToSelf, op));
    },
    [onCommit, pathToSelf, rootDraft],
  );

  const deleteGroup = useCallback(() => {
    onCommit(removeConditionAt(rootDraft, pathToSelf));
  }, [onCommit, pathToSelf, rootDraft]);

  const addCondition = useCallback(() => {
    onCommit(addLeafAt(rootDraft, pathToSelf));
  }, [onCommit, pathToSelf, rootDraft]);

  const addNested = useCallback(() => {
    const trial = addNestedGroupAt(rootDraft, pathToSelf);
    if (maxBranchGroupDepth(trial) > MAX_RULE_NEST_DEPTH) return;
    onCommit(trial);
  }, [onCommit, pathToSelf, rootDraft]);

  return (
    <div
      className={cn(
        'rounded-lg border p-3 shadow-sm space-y-3',
        isDark ? 'border-zinc-600 bg-zinc-900/80' : 'border-zinc-300 bg-zinc-50',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <GripVertical className="size-4 text-zinc-400 shrink-0 hidden sm:block" aria-hidden />
          <span className="text-xs font-medium text-muted-foreground">{t('Match')}</span>
          <Select
            value={group.logical_operator}
            onValueChange={(v) => setGroupOp(v as LogicalOperator)}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 w-[140px] text-xs !border-zinc-300 dark:!border-zinc-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND" className="text-xs">
                {t('ALL (AND)')}
              </SelectItem>
              <SelectItem value="OR" className="text-xs">
                {t('ANY (OR)')}
              </SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{t('of the following:')}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
          disabled={disabled}
          onClick={deleteGroup}
        >
          <Trash2 className="size-3.5" />
          {t('Delete group')}
        </Button>
      </div>

      <div className="space-y-2 pl-0 sm:pl-4">
        {group.conditions.length === 0 ? (
          <p className="text-xs italic text-muted-foreground py-2">
            {t('No conditions yet — add one or a nested group.')}
          </p>
        ) : null}
        {group.conditions.map((child, j) => {
          const childPath = [...pathToSelf, j];
          const key = childPath.join('-');
          if ('conditions' in child) {
            return (
              <RulesGroupCard
                key={key}
                group={child as RuleGroup}
                pathToSelf={childPath}
                disabled={disabled}
                isDark={isDark}
                canNestMore={canNestMore}
                onCommit={onCommit}
                rootDraft={rootDraft}
              />
            );
          }
          return (
            <LeafConditionRow
              key={key}
              path={childPath}
              leaf={child as RuleLeaf}
              disabled={disabled}
              isDark={isDark}
              onUpdate={(patch) => onCommit(updateLeafAt(rootDraft, childPath, patch))}
              onRemove={() => onCommit(removeConditionAt(rootDraft, childPath))}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-700">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          disabled={disabled}
          onClick={addCondition}
        >
          <Plus className="size-3.5" />
          {t('Add condition')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 text-xs"
          disabled={disabled || !canNestMore}
          onClick={addNested}
          title={
            !canNestMore ? t('Maximum nesting depth reached') : t('Add nested group')
          }
        >
          <Plus className="size-3.5" />
          {t('Add nested group')}
        </Button>
      </div>
    </div>
  );
});

export const BadgeRulesBuilder = memo(function BadgeRulesBuilder({
  value,
  onChange,
  disabled,
  isDark,
}: BadgeRulesBuilderProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<RuleGroup>(() => normalizeRuleGroup(value ?? null));

  useEffect(() => {
    setDraft(normalizeRuleGroup(value ?? null));
  }, [value]);

  const commit = useCallback(
    (next: RuleGroup) => {
      setDraft(next);
      onChange(serializeRuleTreeLive(next));
    },
    [onChange],
  );

  const setRootOp = useCallback(
    (op: LogicalOperator) => {
      commit(updateRootOperator(draft, op));
    },
    [commit, draft],
  );

  const addTopLevelCondition = useCallback(() => {
    commit(addRootLeaf(draft));
  }, [commit, draft]);

  const addTopLevelGroup = useCallback(() => {
    commit(addRootGroup(draft));
  }, [commit, draft]);

  const rootSeparatorLabel = draft.logical_operator === 'OR' ? 'OR' : 'AND';

  const canNestGlobally = maxBranchGroupDepth(draft) < MAX_RULE_NEST_DEPTH;

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'rounded-md border px-3 py-2',
          isDark ? 'border-zinc-700 bg-zinc-950/50' : 'border-zinc-300 bg-white',
        )}
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          {t('Badge rules configuration')}
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">{t('Match')}</span>
        <Select
          value={draft.logical_operator}
          onValueChange={(v) => setRootOp(v as LogicalOperator)}
          disabled={disabled}
        >
          <SelectTrigger className="h-9 w-[148px] text-xs !border-zinc-300 dark:!border-zinc-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OR" className="text-xs">
              {t('ANY (OR)')}
            </SelectItem>
            <SelectItem value="AND" className="text-xs">
              {t('ALL (AND)')}
            </SelectItem>
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">
          {t('of the following groups/conditions:')}
        </span>
      </div>

      <div className="space-y-2">
        {draft.conditions.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            {t('No rules yet. Add a condition or a group below.')}
          </p>
        ) : null}

        {draft.conditions.map((child, i) => {
          const key = `root-${i}`;
          const showSep = i > 0;
          return (
            <div key={key}>
              {showSep ? <Separator label={rootSeparatorLabel} /> : null}
              {'conditions' in child ? (
                <RulesGroupCard
                  group={child as RuleGroup}
                  pathToSelf={[i]}
                  disabled={disabled}
                  isDark={isDark}
                  canNestMore={canNestGlobally}
                  onCommit={commit}
                  rootDraft={draft}
                />
              ) : (
                <LeafConditionRow
                  path={[i]}
                  leaf={child as RuleLeaf}
                  disabled={disabled}
                  isDark={isDark}
                  onUpdate={(patch) => commit(updateLeafAt(draft, [i], patch))}
                  onRemove={() => commit(removeConditionAt(draft, [i]))}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-9 gap-1 text-xs"
          disabled={disabled}
          onClick={addTopLevelCondition}
        >
          <Plus className="size-3.5" />
          {t('Add condition')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-9 gap-1 text-xs"
          disabled={disabled}
          onClick={addTopLevelGroup}
        >
          <Plus className="size-3.5" />
          {t('Add group')}
        </Button>
      </div>
    </div>
  );
});
