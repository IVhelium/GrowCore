export default function UsersTabs({ tabs, activeTab, onChange }) {
  return (
    <div className="mt-8 flex max-w-2xl rounded-lg border border-slate-200 bg-slate-50 p-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-bold transition ${
              activeTab === tab.id
                ? "bg-white text-[#4F8A5B] shadow-sm"
                : "text-slate-500 hover:text-slate-950"
            }`}
          >
            <Icon size={17} />
            {tab.label}
            {tab.count > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded bg-red-500 px-1 text-[11px] font-bold text-white">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
