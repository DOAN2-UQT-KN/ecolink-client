export type AppLocale = "en" | "vi";

export type LocalizedText = {
  en?: string | null;
  vi?: string | null;
  original?: string | null;
};

/** en: titleEn → title; vi: titleVi → title (matches @da2/constants). */
export function pickLocalizedText(
  text: LocalizedText,
  locale: AppLocale,
): string {
  const o = text.original?.trim();
  if (locale === "vi") {
    return text.vi?.trim() || text.en?.trim() || o || "";
  }
  return text.en?.trim() || text.vi?.trim() || o || "";
}

export type LocalizableEntity = Record<string, unknown>;

function readStringField(
  entity: LocalizableEntity,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const v = entity[key];
    if (typeof v === "string" && v.trim()) {
      return v.trim();
    }
  }
  return null;
}

export function toLocalizedTitleFields(entity: LocalizableEntity): LocalizedText {
  return {
    original: readStringField(entity, "title", "name"),
    vi: readStringField(entity, "title_vi", "titleVi", "name_vi", "nameVi"),
    en: readStringField(entity, "title_en", "titleEn", "name_en", "nameEn"),
  };
}

export function toLocalizedDescriptionFields(
  entity: LocalizableEntity,
): LocalizedText {
  return {
    original: readStringField(entity, "description", "content"),
    vi: readStringField(
      entity,
      "description_vi",
      "descriptionVi",
      "content_vi",
      "contentVi",
    ),
    en: readStringField(
      entity,
      "description_en",
      "descriptionEn",
      "content_en",
      "contentEn",
    ),
  };
}

export function pickEntityTitle(
  entity: LocalizableEntity,
  locale: AppLocale,
): string {
  return pickLocalizedText(toLocalizedTitleFields(entity), locale);
}

export function pickEntityDescription(
  entity: LocalizableEntity,
  locale: AppLocale,
): string {
  return pickLocalizedText(toLocalizedDescriptionFields(entity), locale);
}
