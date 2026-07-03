import { adminSortOptions, adminTabs } from "./adminConstants";

export default function AdminToolbar({
  activeTab,
  tabSearch,
  tabSort,
  onSearchChange,
  onSortChange,
}) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_15rem]">
      <input
        value={tabSearch[activeTab] || ""}
        onChange={(event) => onSearchChange(activeTab, event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
        placeholder={`Search ${adminTabs.find((tab) => tab.id === activeTab)?.label || "admin tab"}...`}
      />
      <label className="sr-only" htmlFor="admin-tab-sort">
        Sort current tab
      </label>
      <select
        id="admin-tab-sort"
        value={tabSort[activeTab]}
        onChange={(event) => onSortChange(activeTab, event.target.value)}
        className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#4F8A5B]"
      >
        {(adminSortOptions[activeTab] || []).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
