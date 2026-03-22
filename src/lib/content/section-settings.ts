import type { PageSection } from "@/types/content";

interface SectionPanelItem {
  label: string;
  value: string;
  description: string | null;
}

interface SectionLinkItem {
  label: string;
  href: string;
}

interface SectionVectorItem {
  label: string;
  value: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => asString(item))
    .filter((item): item is string => Boolean(item));
}

export function getSectionSettingString(
  section: Pick<PageSection, "settings"> | null | undefined,
  key: string,
) {
  return asString(section?.settings?.[key]);
}

export function getSectionSettingStringArray(
  section: Pick<PageSection, "settings"> | null | undefined,
  key: string,
) {
  return asStringArray(section?.settings?.[key]);
}

export function getSectionPanelItems(
  section: Pick<PageSection, "settings"> | null | undefined,
  key: string,
  fallback: SectionPanelItem[],
): SectionPanelItem[] {
  const value = section?.settings?.[key];
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => {
      const record = asRecord(item);
      const label = asString(record.label);
      const itemValue = asString(record.value);

      if (!label || !itemValue) {
        return null;
      }

      return {
        label,
        value: itemValue,
        description: asString(record.description) ?? null,
      } satisfies SectionPanelItem;
    })
    .filter((item): item is SectionPanelItem => Boolean(item));

  return items.length > 0 ? items : fallback;
}

export function getSectionLinkItems(
  section: Pick<PageSection, "settings"> | null | undefined,
  key: string,
  fallback: SectionLinkItem[],
): SectionLinkItem[] {
  const value = section?.settings?.[key];
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => {
      const record = asRecord(item);
      const label = asString(record.label);
      const href = asString(record.href);

      if (!label || !href) {
        return null;
      }

      return {
        label,
        href,
      } satisfies SectionLinkItem;
    })
    .filter((item): item is SectionLinkItem => Boolean(item));

  return items.length > 0 ? items : fallback;
}

export function getSectionVectorItems(
  section: Pick<PageSection, "settings"> | null | undefined,
  key: string,
  fallback: SectionVectorItem[],
): SectionVectorItem[] {
  const value = section?.settings?.[key];
  if (!Array.isArray(value)) {
    return fallback;
  }

  const items = value
    .map((item) => {
      const record = asRecord(item);
      const label = asString(record.label);
      const itemValue = asString(record.value);

      if (!label || !itemValue) {
        return null;
      }

      return {
        label,
        value: itemValue,
      } satisfies SectionVectorItem;
    })
    .filter((item): item is SectionVectorItem => Boolean(item));

  return items.length > 0 ? items : fallback;
}

export function getPrimarySection(
  sections: PageSection[],
  preferredKeys: string[],
  preferredTypes: string[],
) {
  return (
    sections.find((section) => preferredKeys.includes(section.sectionKey)) ??
    sections.find((section) => preferredTypes.includes(section.sectionType)) ??
    sections[0] ??
    null
  );
}
