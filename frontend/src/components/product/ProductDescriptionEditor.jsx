import { useMemo, useState } from "react";
import {
  composeProductDescription,
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
  const [sections, setSections] = useState(() =>
    parseProductDescription(defaultValue),
  );
  const composedDescription = useMemo(
    () => composeProductDescription(sections),
    [sections],
  );

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
          <label key={section.key} className="grid gap-2">
            <span className="text-xs font-bold uppercase text-slate-500">
              {section.label}
            </span>
            <textarea
              value={sections[section.key] || ""}
              onChange={(event) => updateSection(section.key, event.target.value)}
              required
              rows={section.key === "characteristics" ? 5 : 3}
              placeholder={placeholders[section.key]}
              className="resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
