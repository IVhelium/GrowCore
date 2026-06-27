import { useMemo, useState } from "react";
import {
  parseProductDescription,
  PRODUCT_DESCRIPTION_TEMPLATE,
  PRODUCT_DESCRIPTION_SECTIONS,
} from "../../utils/productDescriptionTemplate";

const placeholders = {
  overview: "Short product summary and what problem it solves.",
  useCase: "Where and how this product should be used.",
  compatibility: "Compatible systems, plants, soil types, controllers, fittings, or environments.",
  packageIncludes: "List what the buyer receives in the package.",
  characteristics: "- Brand:\n- Warranty:",
};

export default function ProductDescriptionEditor({
  name = "description",
  defaultValue = PRODUCT_DESCRIPTION_TEMPLATE,
}) {
  const [sections, setSections] = useState(() => {
    const parsedSections = parseProductDescription(defaultValue);
    const characteristicLines = parsedSections.characteristics
      .split("\n")
      .map((line) => line.replace(/^[-*]\s*/, "").trim());
    const brandLine = characteristicLines.find((line) =>
      line.toLowerCase().startsWith("brand:"),
    );
    const warrantyLine = characteristicLines.find((line) =>
      line.toLowerCase().startsWith("warranty:"),
    );
    const otherCharacteristics = characteristicLines
      .filter(
        (line) =>
          line &&
          !line.toLowerCase().startsWith("brand:") &&
          !line.toLowerCase().startsWith("warranty:"),
      )
      .map((line) => `- ${line}`)
      .join("\n");

    return {
      ...parsedSections,
      brand: brandLine?.split(":").slice(1).join(":").trim() || "",
      warranty: warrantyLine?.split(":").slice(1).join(":").trim() || "",
      characteristics: otherCharacteristics,
    };
  });
  const composedDescription = useMemo(() => {
    const characteristics = [
      `- Brand: ${sections.brand || ""}`,
      `- Warranty: ${sections.warranty || ""}`,
      sections.characteristics || "",
    ]
      .filter(Boolean)
      .join("\n");

    return PRODUCT_DESCRIPTION_SECTIONS.map((section) => {
      const value = section.key === "characteristics"
        ? characteristics
        : sections[section.key]?.trim() || "";

      return `${section.label}:\n${value}`;
    }).join("\n\n");
  }, [sections]);

  function updateSection(sectionKey, value) {
    setSections((currentSections) => ({
      ...currentSections,
      [sectionKey]: value,
    }));
  }

  return (
    <div className="grid gap-3 md:col-span-2">
      <span className="text-sm font-semibold text-slate-700">Description</span>
      <input type="hidden" name={name} value={composedDescription} />

      <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
        {PRODUCT_DESCRIPTION_SECTIONS.map((section) => (
          <div key={section.key} className="grid gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">
              {section.label}
            </span>
            {section.key === "characteristics" ? (
              <span className="grid gap-3">
                <span className="grid gap-2 sm:grid-cols-2">
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-slate-400">
                      Brand
                    </span>
                    <input
                      value={sections.brand || ""}
                      onChange={(event) =>
                        updateSection("brand", event.target.value)
                      }
                      required
                      placeholder="e.g. BigCompany"
                      className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-semibold text-slate-400">
                      Warranty
                    </span>
                    <input
                      value={sections.warranty || ""}
                      onChange={(event) =>
                        updateSection("warranty", event.target.value)
                      }
                      required
                      placeholder="e.g. 12 months"
                      className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                    />
                  </label>
                </span>
                <textarea
                  value={sections.characteristics || ""}
                  onChange={(event) =>
                    updateSection(section.key, event.target.value)
                  }
                  rows={3}
                  placeholder="Additional characteristics, one per line."
                  className="resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                />
              </span>
            ) : (
              <textarea
                value={sections[section.key] || ""}
                onChange={(event) =>
                  updateSection(section.key, event.target.value)
                }
                required
                rows={3}
                placeholder={placeholders[section.key]}
                className="resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
