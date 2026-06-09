import { Plus, X } from "lucide-react";
import Button from "../common/Button";
import {
  createAttributeRow,
  getAttributeOptionsForCategory,
  REQUIRED_ATTRIBUTE_NAMES,
} from "../../utils/productAttributeOptions";

function getSelectedNames(rows) {
  return rows.map((row) => row.name).filter(Boolean);
}

export default function ProductAttributeEditor({
  rows,
  categories = [],
  categoryId = "",
  onChange,
}) {
  const selectedCategory = categories.find(
    (category) => String(category.id) === String(categoryId),
  );
  const selectedNames = getSelectedNames(rows);
  const availableOptions = getAttributeOptionsForCategory(selectedCategory?.name)
    .filter((name) => !selectedNames.includes(name));

  function updateRow(rowId, field, value) {
    onChange(
      rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
    );
  }

  function removeRow(rowId) {
    onChange(rows.filter((row) => row.id !== rowId || row.isRequired));
  }

  function addAvailableRow(event) {
    const name = event.target.value;

    if (!name) return;

    onChange([...rows, createAttributeRow(name)]);
    event.target.value = "";
  }

  function addCustomRow() {
    onChange([...rows, createAttributeRow("", { isCustom: true })]);
  }

  return (
    <div className="grid gap-3 md:col-span-2">
      <div>
        <h3 className="text-sm font-semibold text-slate-700">
          Catalog filter attributes
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Brand and warranty are required. Add only the filters that make sense
          for this category.
        </p>
      </div>

      {rows.map((row) => (
        <div
          key={row.id}
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
        >
          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase text-slate-400">
              {row.isRequired
                ? "Required filter"
                : row.isCustom
                  ? "New filter request"
                  : "Category filter"}
            </span>
            <input
              value={row.name}
              readOnly={!row.isCustom}
              onChange={(event) => updateRow(row.id, "name", event.target.value)}
              placeholder="Filter name"
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition read-only:bg-slate-50 focus:border-[#4F8A5B]"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-semibold uppercase text-slate-400">
              Value
            </span>
            <input
              value={row.value}
              required={row.isRequired}
              onChange={(event) => updateRow(row.id, "value", event.target.value)}
              placeholder={
                row.name === "Warranty" ? "e.g. 12 months" : "e.g. BigCompany"
              }
              className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
            />
          </label>

          <button
            type="button"
            onClick={() => removeRow(row.id)}
            disabled={row.isRequired}
            aria-label="Remove attribute"
            className="mt-5 grid h-11 w-11 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X size={17} />
          </button>
        </div>
      ))}

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          defaultValue=""
          onChange={addAvailableRow}
          className="min-h-10 flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#4F8A5B]"
        >
          <option value="">Add available category filter</option>
          {availableOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>

        <Button type="button" style="secondary" onClick={addCustomRow}>
          <Plus size={17} />
          Request new filter
        </Button>
      </div>

      <p className="text-xs text-slate-400">
        Required: {REQUIRED_ATTRIBUTE_NAMES.join(", ")}
      </p>
    </div>
  );
}
