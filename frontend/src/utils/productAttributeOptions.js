export const REQUIRED_ATTRIBUTE_NAMES = ["Brand", "Warranty"];

const commonOptions = [
  "Compatibility",
  "Material",
  "Dimensions",
  "Weight",
  "Package size",
  "Country of origin",
];

const categoryOptions = [
  {
    keywords: ["soil", "earth", "substrate", "fertilizer", "ground"],
    options: ["Soil type", "Volume", "pH range", "NPK ratio", "Organic", "Drainage"],
  },
  {
    keywords: ["sensor", "probe", "meter"],
    options: ["Measurement range", "Accuracy", "Cable length", "Power / voltage", "Connection type", "Waterproof rating"],
  },
  {
    keywords: ["pump", "valve", "irrigation", "water"],
    options: ["Flow rate", "Pressure", "Connection type", "Power / voltage", "Hose diameter", "Waterproof rating"],
  },
  {
    keywords: ["controller", "module", "relay", "timer"],
    options: ["Power / voltage", "Connection type", "Channels", "Protocol", "Operating temperature"],
  },
  {
    keywords: ["light", "lamp", "led"],
    options: ["Power / voltage", "Spectrum", "Coverage area", "Power draw", "Mount type"],
  },
];

function unique(values) {
  // Removes duplicate and empty option names from a list.
  return [...new Set(values.filter(Boolean))];
}

export function getAttributeOptionsForCategory(categoryName = "") {
  // Returns common and category-specific attribute suggestions for product forms.
  const normalizedCategory = categoryName.toLowerCase();
  const matchedOptions = categoryOptions
    .filter((group) =>
      group.keywords.some((keyword) => normalizedCategory.includes(keyword)),
    )
    .flatMap((group) => group.options);

  return unique([...commonOptions, ...matchedOptions]).sort((first, second) =>
    first.localeCompare(second),
  );
}

export function createRequiredAttributeRows() {
  // Creates empty rows for attributes that every product must include.
  return REQUIRED_ATTRIBUTE_NAMES.map((name) => ({
    id: crypto.randomUUID(),
    name,
    value: "",
    isRequired: true,
    isCustom: false,
  }));
}

export function createAttributeRow(name, options = {}) {
  // Creates one consistent attribute row for the product editor.
  return {
    id: crypto.randomUUID(),
    name,
    value: options.value || "",
    isRequired: REQUIRED_ATTRIBUTE_NAMES.includes(name),
    isCustom: Boolean(options.isCustom),
  };
}
