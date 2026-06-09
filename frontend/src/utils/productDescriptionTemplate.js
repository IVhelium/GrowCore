export const PRODUCT_DESCRIPTION_SECTIONS = [
  { key: "overview", label: "Overview" },
  { key: "useCase", label: "Use case" },
  { key: "compatibility", label: "Compatibility" },
  { key: "packageIncludes", label: "Package includes" },
  { key: "characteristics", label: "Characteristics" },
];

export const PRODUCT_DESCRIPTION_TEMPLATE = `Overview:

Use case:

Compatibility:

Package includes:

Characteristics:
- Brand:
- Warranty:`;

export function parseProductDescription(description = "") {
  const values = PRODUCT_DESCRIPTION_SECTIONS.reduce((sections, section) => {
    sections[section.key] = "";
    return sections;
  }, {});

  const source = description || PRODUCT_DESCRIPTION_TEMPLATE;

  PRODUCT_DESCRIPTION_SECTIONS.forEach((section, index) => {
    const startMarker = `${section.label}:`;
    const nextSection = PRODUCT_DESCRIPTION_SECTIONS[index + 1];
    const startIndex = source.toLowerCase().indexOf(startMarker.toLowerCase());

    if (startIndex === -1) return;

    const contentStart = startIndex + startMarker.length;
    const nextIndex = nextSection
      ? source.toLowerCase().indexOf(`${nextSection.label}:`.toLowerCase(), contentStart)
      : -1;

    values[section.key] = source
      .slice(contentStart, nextIndex === -1 ? undefined : nextIndex)
      .trim();
  });

  return values;
}

export function composeProductDescription(sections = {}) {
  return PRODUCT_DESCRIPTION_SECTIONS.map((section) => {
    const value = sections[section.key]?.trim() || "";
    return `${section.label}:\n${value}`;
  }).join("\n\n");
}

export function hasRequiredDescriptionSections(description = "") {
  const lowerDescription = description.toLowerCase();

  return PRODUCT_DESCRIPTION_SECTIONS.every((section) =>
    lowerDescription.includes(`${section.label}:`.toLowerCase()),
  );
}

export function hasFilledCharacteristics(description = "") {
  if (!hasRequiredDescriptionSections(description)) return false;

  const marker = "characteristics:";
  const markerIndex = description.toLowerCase().indexOf(marker);

  if (markerIndex === -1) return false;

  const characteristics = description.slice(markerIndex + marker.length);
  const filledLines = characteristics
    .split("\n")
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter((line) => {
      if (!line) return false;
      const [, value = ""] = line.split(":");
      return value.trim().length >= 2;
    });
  const hasBrand = filledLines.some((line) =>
    line.toLowerCase().startsWith("brand:"),
  );
  const hasWarranty = filledLines.some((line) =>
    line.toLowerCase().startsWith("warranty:"),
  );

  return hasBrand && hasWarranty;
}
