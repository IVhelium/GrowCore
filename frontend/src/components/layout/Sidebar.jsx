import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { getCategoryIcon } from "../../utils/categoryIcons";


// Sidebar category row with icon and catalog filter link.
function CatalogLink({ item }) {
  // Category-specific icon from shared mapping.
  const Icon = getCategoryIcon(item.name);

  return (
    <Link
      to={`/catalog?category=${item.id}`}
      className="group flex min-h-11 items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-sm text-slate-700 transition last:border-b-0 hover:bg-[#F2F8F3] hover:text-[#4F8A5B]"
    >
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Icon
        size={18}
        strokeWidth={1.8}
        className="shrink-0 text-slate-400 transition group-hover:text-[#4F8A5B]"
      />

      <span className="min-w-0 flex-1 font-medium">{item.name}</span>

      <ChevronRight
        size={16}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#4F8A5B]"
      />
    </Link>
  );
}

// Desktop sticky catalog sidebar.
export default function Sidebar({ categories = [] }) {
  return (
    <aside className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
      <div className="overflow-hidden rounded-sm border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
          <h2 className="text-base font-bold text-slate-950">Catalog</h2>

          <Link
            to="/catalog"
            className="text-xs font-semibold text-[#4F8A5B] transition hover:text-[#3F7148]"
          >
            View all
          </Link>
        </div>

        <nav>
          {categories.map((item) => (
            <CatalogLink key={item.id} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
