/**
 * Field errors from a rejected request, in either server shape: `{ field, message }` (point rules)
 * or express-validator's `{ path, msg }`.
 */
export function fieldErrorsFromApi(error: unknown): Array<{ field: string; message: string }> {
  const list = (error as { errors?: unknown[] } | null)?.errors;
  if (!Array.isArray(list)) return [];
  return list.flatMap((e) => {
    const item = e as { field?: string; path?: string; message?: string; msg?: string };
    const field = item.field ?? item.path;
    const message = item.message ?? item.msg;
    return field && message ? [{ field, message }] : [];
  });
}
