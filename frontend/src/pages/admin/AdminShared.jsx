import { adminTabs } from "./adminConstants";

export function AdminTabs({ activeTab, onChange }) {
  return (
    <div className="mt-8 flex max-w-full snap-x overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      {adminTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`shrink-0 snap-start border-b-2 px-4 py-3 text-sm font-bold transition sm:px-5 sm:py-4 ${
            activeTab === tab.id
              ? "border-[#4F8A5B] text-[#4F8A5B]"
              : "border-transparent text-slate-500 hover:text-slate-950"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    open: "bg-blue-50 text-blue-700",
    in_progress: "bg-indigo-50 text-indigo-700",
    assigned: "bg-indigo-50 text-indigo-700",
    paid: "bg-green-50 text-green-700",
    approved: "bg-green-50 text-green-700",
    refunded: "bg-sky-50 text-sky-700",
    failed: "bg-red-50 text-red-700",
    rejected: "bg-red-50 text-red-700",
    blocked: "bg-orange-50 text-orange-700",
    deleted: "bg-slate-200 text-slate-700",
    preparing: "bg-amber-50 text-amber-700",
    delivered: "bg-green-50 text-green-700",
    delayed: "bg-red-50 text-red-700",
    none: "bg-slate-100 text-slate-600",
    requested: "bg-amber-50 text-amber-700",
    resolved: "bg-green-50 text-green-700",
    closed: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-lg px-3 py-1 text-xs font-bold uppercase ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status?.replace("_", " ") || "unknown"}
    </span>
  );
}

export function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{item.title}</p>
          <div className="mt-2 text-3xl font-black text-slate-950">
            {item.value}
          </div>
          <p className="mt-2 text-sm text-slate-500">{item.text}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
          <Icon size={24} />
        </div>
      </div>
    </article>
  );
}

export function AttributeChips({ attributes = {} }) {
  const entries = Object.entries(attributes).filter(([, value]) => value);

  if (!entries.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {entries.map(([name, value]) => (
        <span
          key={name}
          className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
        >
          {name}: {value}
        </span>
      ))}
    </div>
  );
}

export function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="break-anywhere mt-1 text-sm leading-6 text-slate-700">
        {value || "-"}
      </p>
    </div>
  );
}
