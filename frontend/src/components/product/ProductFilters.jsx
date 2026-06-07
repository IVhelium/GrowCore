/* eslint-disable no-unused-vars */
import { useMemo, useRef } from "react";
import { ChevronDown } from "lucide-react";

const FILTER_CHANGE_DELAY_MS = 300;

function getFormFilters(form) {
  const formData = new FormData(form);
  const filters = {};
  const attributeFilters = {};

  for (const [name, value] of formData.entries()) {
    if (!value) continue;

    if (name.startsWith("attribute:")) {
      const attributeName = name.slice("attribute:".length);
      attributeFilters[attributeName] = [
        ...(attributeFilters[attributeName] || []),
        value,
      ];
      continue;
    }

    if (filters[name]) {
      filters[name] = Array.isArray(filters[name])
        ? [...filters[name], value]
        : [filters[name], value];
    } else {
      filters[name] = value;
    }
  }

  if (Object.keys(attributeFilters).length) {
    filters.attributes = attributeFilters;
  }

  return filters;
}

function countBy(products, getValue) {
  return products.reduce((counts, product) => {
    const value = getValue(product);

    if (!value) return counts;

    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function FilterSection({ title, count, children }) {
  return (
    <section className="border-b border-slate-200 px-4 py-4 last:border-b-0">
      <button
        type="button"
        className="mb-3 flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-bold text-slate-950">
          {title}
          {count ? (
            <span className="ml-1 font-semibold text-slate-400">{count}</span>
          ) : null}
        </span>
        <ChevronDown size={17} className="shrink-0 text-slate-400" />
      </button>
      {children}
    </section>
  );
}

function FilterOption({ name, value, type = "checkbox", label, count }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-slate-700 transition hover:text-[#4F8A5B]">
      <input
        name={name}
        value={value}
        type={type}
        className="h-4 w-4 shrink-0 rounded border-slate-300 accent-[#4F8A5B]"
      />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count ? (
        <span className="shrink-0 text-xs text-slate-400">{count}</span>
      ) : null}
    </label>
  );
}

export default function ProductFilters({
  categories = [],
  products = [],
  onChange,
  onSortChange,
}) {
  const filterTimer = useRef(null);

  const categoryCounts = useMemo(
    () => countBy(products, (product) => String(product.categoryId || "")),
    [products],
  );

  const sellerCounts = useMemo(
    () => countBy(products, (product) => product.store?.name || ""),
    [products],
  );

  const attributeGroups = useMemo(() => {
    const groups = {};

    products.forEach((product) => {
      Object.entries(product.attributes || {}).forEach(([name, value]) => {
        const cleanName = String(name).trim();
        const cleanValue = String(value).trim();

        if (!cleanName || !cleanValue) return;

        groups[cleanName] = groups[cleanName] || {};
        groups[cleanName][cleanValue] = (groups[cleanName][cleanValue] || 0) + 1;
      });
    });

    return Object.entries(groups)
      .map(([name, values]) => ({
        name,
        values: Object.entries(values).sort((first, second) =>
          first[0].localeCompare(second[0]),
        ),
      }))
      .sort((first, second) => first.name.localeCompare(second.name));
  }, [products]);

  function applyFilters(form, delay = FILTER_CHANGE_DELAY_MS) {
    if (filterTimer.current) {
      clearTimeout(filterTimer.current);
    }

    filterTimer.current = setTimeout(() => {
      onChange?.(getFormFilters(form));
    }, delay);
  }

  function handleChange(event) {
    const delay =
      event.target.name === "minPrice" || event.target.name === "maxPrice"
        ? FILTER_CHANGE_DELAY_MS
        : 0;

    applyFilters(event.currentTarget, delay);
  }

  function handleSubmit(event) {
    event.preventDefault();
    applyFilters(event.currentTarget, 0);
  }

  function handleReset(event) {
    if (filterTimer.current) {
      clearTimeout(filterTimer.current);
    }

    setTimeout(() => onChange?.({}), 0);
  }

  return (
    <form
      onSubmit={handleSubmit}
      onChange={handleChange}
      onReset={handleReset}
      className="catalog-filter-panel overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24 lg:max-h-[calc(100dvh-6rem)] lg:self-start lg:overflow-y-auto"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h2 className="text-base font-bold text-slate-950">Filters</h2>
        <button
          type="reset"
          className="text-sm font-semibold text-[#4F8A5B] hover:text-[#3F7148]"
        >
          Clear
        </button>
      </div>

      <FilterSection title="Sort by">
        <select
          defaultValue="random"
          onChange={(event) => onSortChange?.(event.target.value)}
          className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#4F8A5B]"
        >
          <option value="random">Random</option>
          <option value="popular">Most popular</option>
          <option value="price-asc">Lowest price</option>
          <option value="price-des">Highest price</option>
          <option value="new">Newest</option>
        </select>
      </FilterSection>

      {Object.keys(sellerCounts).length > 0 && (
        <FilterSection title="Seller" count={Object.keys(sellerCounts).length}>
          <div className="grid gap-1">
            {Object.entries(sellerCounts).map(([seller, count]) => (
              <FilterOption
                key={seller}
                name="seller"
                value={seller}
                label={seller}
                count={count}
              />
            ))}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Category" count={categories.length}>
        <div className="grid gap-1">
          {categories.map((category) => (
            <FilterOption
              key={category.id}
              name="category"
              value={category.id}
              type="radio"
              label={category.name}
              count={categoryCounts[String(category.id)] || 0}
            />
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price">
        <div className="flex items-center gap-2">
          <input
            name="minPrice"
            placeholder="From"
            inputMode="numeric"
            className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#4F8A5B]"
          />
          <span className="text-slate-400">-</span>
          <input
            name="maxPrice"
            placeholder="To"
            inputMode="numeric"
            className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#4F8A5B]"
          />
        </div>
      </FilterSection>

      <FilterSection title="Availability" count="2">
        <div className="grid gap-1">
          <FilterOption
            name="availability"
            value="ready"
            label="Ready to ship"
            count={products.filter((product) => product.quantity > 0).length}
          />
          <FilterOption
            name="availability"
            value="out"
            label="Out of stock"
            count={products.filter((product) => product.quantity <= 0).length}
          />
        </div>
      </FilterSection>

      <FilterSection title="Label" count="4">
        <div className="grid gap-1">
          {["Deal", "New", "Hot", "Popular"].map((tag) => (
            <FilterOption key={tag} name="label" value={tag} label={tag} />
          ))}
        </div>
      </FilterSection>

      {attributeGroups.map((group) => (
        <FilterSection
          key={group.name}
          title={group.name}
          count={group.values.length}
        >
          <div className="grid gap-1">
            {group.values.map(([value, count]) => (
              <FilterOption
                key={value}
                name={`attribute:${group.name}`}
                value={value}
                label={value}
                count={count}
              />
            ))}
          </div>
        </FilterSection>
      ))}
    </form>
  );
}
