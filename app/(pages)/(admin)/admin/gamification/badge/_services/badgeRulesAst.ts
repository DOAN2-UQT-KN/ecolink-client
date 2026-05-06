export type LogicalOperator = 'AND' | 'OR';
export type AggOp = 'COUNT' | 'SUM';
export type CompareOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';

export interface RuleLeaf {
  target: string;
  /** Empty string = unset in UI; API payload coerces to COUNT. */
  agg: AggOp | '';
  field: string;
  operator: CompareOperator;
  value: number;
}

export interface RuleGroup {
  logical_operator: LogicalOperator;
  conditions: Array<RuleLeaf | RuleGroup>;
}

export const AGG_OPTIONS: { value: AggOp; label: string }[] = [
  { value: 'COUNT', label: 'COUNT' },
  { value: 'SUM', label: 'SUM' },
];

export const OPERATOR_OPTIONS: { value: CompareOperator; label: string }[] = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
  { value: 'neq', label: '≠' },
];

export const MAX_RULE_NEST_DEPTH = 10;

export function emptyRoot(): RuleGroup {
  return { logical_operator: 'OR', conditions: [] };
}

export function defaultLeaf(): RuleLeaf {
  return {
    target: '',
    agg: '',
    field: '',
    operator: 'gt',
    value: 0,
  };
}

export function cloneRuleTree(g: RuleGroup): RuleGroup {
  return JSON.parse(JSON.stringify(g)) as RuleGroup;
}

function normalizeCompareOp(v: unknown): CompareOperator {
  const s = String(v ?? 'gte').toLowerCase();
  if (s === 'gt' || s === 'gte' || s === 'lt' || s === 'lte' || s === 'eq' || s === 'neq') {
    return s;
  }
  return 'gte';
}

function normalizeAgg(v: unknown): AggOp | '' {
  const s = typeof v === 'string' ? v.trim().toUpperCase() : '';
  if (s === 'SUM') return 'SUM';
  if (s === 'COUNT') return 'COUNT';
  return '';
}

function normalizeLeaf(node: Record<string, unknown>): RuleLeaf {
  const agg = normalizeAgg(node.agg);
  const operator = normalizeCompareOp(node.operator);
  const value =
    typeof node.value === 'number' && Number.isFinite(node.value)
      ? node.value
      : Number(node.value) || 0;
  const target = typeof node.target === 'string' ? node.target : '';
  const field = typeof node.field === 'string' ? node.field : '';
  return { target, agg, field, operator, value };
}

/** Normalize API / saved JSON into a mutable rule tree. */
export function normalizeRuleGroup(raw: unknown): RuleGroup {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return emptyRoot();
  }
  const o = raw as Record<string, unknown>;
  const logical_operator: LogicalOperator =
    o.logical_operator === 'AND' || o.logical_operator === 'OR' ? o.logical_operator : 'OR';
  const conditionsRaw = Array.isArray(o.conditions) ? o.conditions : [];
  const conditions: Array<RuleLeaf | RuleGroup> = [];
  for (const c of conditionsRaw) {
    if (!c || typeof c !== 'object' || Array.isArray(c)) continue;
    const node = c as Record<string, unknown>;
    if (Array.isArray(node.conditions)) {
      conditions.push(normalizeRuleGroup(node));
    } else if (typeof node.target === 'string') {
      conditions.push(normalizeLeaf(node));
    }
  }
  return { logical_operator, conditions };
}

function serializeLeaf(node: RuleLeaf, forApi: boolean): Record<string, unknown> {
  const aggForApi: AggOp = node.agg === 'SUM' ? 'SUM' : 'COUNT';
  if (forApi) {
    return {
      target: node.target,
      agg: aggForApi,
      field: node.field,
      operator: node.operator,
      value: node.value,
    };
  }
  return {
    target: node.target,
    agg: node.agg,
    field: node.field,
    operator: node.operator,
    value: node.value,
  };
}

function serializeGroup(g: RuleGroup, forApi: boolean): Record<string, unknown> {
  return {
    logical_operator: g.logical_operator,
    conditions: g.conditions.map((c) =>
      'conditions' in c ? serializeGroup(c as RuleGroup, forApi) : serializeLeaf(c as RuleLeaf, forApi),
    ),
  };
}

/** Drop empty nested groups; returns null if nothing left at root. */
export function pruneRuleTree(group: RuleGroup): RuleGroup | null {
  const nextConditions: Array<RuleLeaf | RuleGroup> = [];
  for (const c of group.conditions) {
    if ('conditions' in c) {
      const inner = c as RuleGroup;
      const pruned = pruneRuleTree(inner);
      if (pruned && pruned.conditions.length > 0) {
        nextConditions.push(pruned);
      }
    } else {
      nextConditions.push(c as RuleLeaf);
    }
  }
  if (nextConditions.length === 0) return null;
  return { ...group, conditions: nextConditions };
}

/** Serialize live editor state (keeps empty groups). */
export function serializeRuleTreeLive(root: RuleGroup): Record<string, unknown> {
  return serializeGroup(root, false);
}

/** Payload for API; null when no conditions (same as legacy “no rules”). */
export function rulesPayloadFromRoot(root: RuleGroup): Record<string, unknown> | null {
  const pruned = pruneRuleTree(root);
  if (!pruned) return null;
  return serializeGroup(pruned, true);
}

/** Normalize stored JSON and prune empty groups for PATCH/POST. */
export function ruleTreeToApiPayload(
  raw: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (raw == null) return null;
  return rulesPayloadFromRoot(normalizeRuleGroup(raw));
}

export function depthOfSubtree(node: RuleLeaf | RuleGroup): number {
  if (!('conditions' in node)) return 0;
  let max = 0;
  for (const c of node.conditions) {
    max = Math.max(max, 1 + depthOfSubtree(c));
  }
  return max;
}

/** Deepest nested group depth under `g` (0 = only leaves under this group). */
export function maxBranchGroupDepth(g: RuleGroup): number {
  let max = 0;
  for (const c of g.conditions) {
    if ('conditions' in c) {
      max = Math.max(max, 1 + maxBranchGroupDepth(c as RuleGroup));
    }
  }
  return max;
}

export function mutateGroup(
  root: RuleGroup,
  groupPath: number[],
  fn: (g: RuleGroup) => void,
): RuleGroup {
  const copy = cloneRuleTree(root);
  let target = copy;
  for (const idx of groupPath) {
    const next = target.conditions[idx];
    if (!next || !('conditions' in next)) return root;
    target = next as RuleGroup;
  }
  fn(target);
  return copy;
}

export function addLeafAt(root: RuleGroup, groupPath: number[]): RuleGroup {
  return mutateGroup(root, groupPath, (g) => {
    g.conditions.push(defaultLeaf());
  });
}

export function addNestedGroupAt(root: RuleGroup, groupPath: number[]): RuleGroup {
  return mutateGroup(root, groupPath, (g) => {
    g.conditions.push({ logical_operator: 'AND', conditions: [] });
  });
}

export function addRootLeaf(root: RuleGroup): RuleGroup {
  return addLeafAt(root, []);
}

export function addRootGroup(root: RuleGroup): RuleGroup {
  const copy = cloneRuleTree(root);
  copy.conditions.push({ logical_operator: 'AND', conditions: [] });
  return copy;
}

export function updateRootOperator(root: RuleGroup, op: LogicalOperator): RuleGroup {
  const copy = cloneRuleTree(root);
  copy.logical_operator = op;
  return copy;
}

export function updateGroupOperatorAt(
  root: RuleGroup,
  groupPath: number[],
  op: LogicalOperator,
): RuleGroup {
  return mutateGroup(root, groupPath, (g) => {
    g.logical_operator = op;
  });
}

export function removeConditionAt(root: RuleGroup, pathFromRoot: number[]): RuleGroup {
  if (pathFromRoot.length === 0) return root;
  const copy = cloneRuleTree(root);
  let parent = copy;
  for (let i = 0; i < pathFromRoot.length - 1; i++) {
    const idx = pathFromRoot[i];
    const next = parent.conditions[idx];
    if (!next || !('conditions' in next)) return root;
    parent = next as RuleGroup;
  }
  const removeIdx = pathFromRoot[pathFromRoot.length - 1];
  parent.conditions.splice(removeIdx, 1);
  return copy;
}

export function updateLeafAt(
  root: RuleGroup,
  pathFromRoot: number[],
  patch: Partial<RuleLeaf>,
): RuleGroup {
  const copy = cloneRuleTree(root);
  let parent = copy;
  for (let i = 0; i < pathFromRoot.length - 1; i++) {
    const idx = pathFromRoot[i];
    const next = parent.conditions[idx];
    if (!next || !('conditions' in next)) return root;
    parent = next as RuleGroup;
  }
  const li = pathFromRoot[pathFromRoot.length - 1];
  const node = parent.conditions[li];
  if (!node || 'conditions' in node) return root;
  Object.assign(node as RuleLeaf, patch);
  return copy;
}
