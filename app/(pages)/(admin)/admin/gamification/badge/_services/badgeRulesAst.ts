export type LogicalOperator = 'AND' | 'OR';
export type AggOp = 'COUNT' | 'SUM';
export type CompareOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';

export interface RuleLeaf {
  target: string;
  agg: AggOp;
  field: string;
  operator: CompareOperator;
  value: number;
}

export interface RuleGroup {
  logical_operator: LogicalOperator;
  conditions: Array<RuleLeaf | RuleGroup>;
}

export const RULE_TARGETS = [
  'orders',
  'reviews',
  'reports',
  'votes',
  'user_point_transactions',
] as const;

export type RuleTargetId = (typeof RULE_TARGETS)[number];

export const TARGET_LABEL: Record<RuleTargetId, string> = {
  orders: 'Orders',
  reviews: 'Reviews',
  reports: 'Reports',
  votes: 'Votes',
  user_point_transactions: 'Point ledger',
};

/** Suggested Prisma field names per target (admin may type others). */
export const TARGET_FIELD_PRESETS: Record<RuleTargetId, string[]> = {
  orders: ['id', 'totalAmount', 'total_amount'],
  reviews: ['id'],
  reports: ['id'],
  votes: ['id'],
  user_point_transactions: ['id', 'amount'],
};

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
    target: 'orders',
    agg: 'COUNT',
    field: 'id',
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

function normalizeLeaf(node: Record<string, unknown>): RuleLeaf {
  const agg: AggOp = node.agg === 'SUM' ? 'SUM' : 'COUNT';
  const operator = normalizeCompareOp(node.operator);
  const value =
    typeof node.value === 'number' && Number.isFinite(node.value)
      ? node.value
      : Number(node.value) || 0;
  const rawTarget = typeof node.target === 'string' ? node.target : 'orders';
  const target = RULE_TARGETS.includes(rawTarget as RuleTargetId)
    ? rawTarget
    : rawTarget;
  const field = typeof node.field === 'string' ? node.field : 'id';
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

function serializeGroup(g: RuleGroup): Record<string, unknown> {
  return {
    logical_operator: g.logical_operator,
    conditions: g.conditions.map((c) =>
      'conditions' in c ? serializeGroup(c as RuleGroup) : { ...(c as RuleLeaf) },
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
  return serializeGroup(root);
}

/** Payload for API; null when no conditions (same as legacy “no rules”). */
export function rulesPayloadFromRoot(root: RuleGroup): Record<string, unknown> | null {
  const pruned = pruneRuleTree(root);
  if (!pruned) return null;
  return serializeGroup(pruned);
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

export function isRuleTargetId(s: string): s is RuleTargetId {
  return (RULE_TARGETS as readonly string[]).includes(s);
}
