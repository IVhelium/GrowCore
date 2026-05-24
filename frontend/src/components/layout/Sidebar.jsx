import { ChevronRight } from "lucide-react";
import { quickCategories } from "../../data/testData"
import { Link } from "react-router-dom";


export default function Sidebar() {
    return (
      <aside className="hidden rounded-sm border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">Catalog</h2>
          <ChevronRight size={18} className="text-[#4F8A5B]" />
        </div>

        <nav className="grid gap-1">
          {quickCategories.map((category) => (
            <Link
              key={category}
              to={`/catalog?category=${encodeURIComponent(category)}`}
              className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-[#4F8A5B] hover:text-white"
            >
                {category}
                <ChevronRight size={15} className="opacity-0 transition group-hover:opacity-100"/>
            </Link>
          ))}
        </nav>
      </aside>
    );
}