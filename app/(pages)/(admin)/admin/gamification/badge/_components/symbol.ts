export function isImageSymbol(symbol?: string | null): boolean {
  const v = symbol?.trim();
  if (!v) return false;
  return v.startsWith("http") || v.startsWith("data:image");
}

