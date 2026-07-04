export default function OrdersTabs({
  activeTab,
  tabs,
  onChange,
}) {
  return (
    <div className="inline-flex max-w-full flex-wrap rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
            activeTab === tab.id
              ? "bg-[#4F8A5B] text-white"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
