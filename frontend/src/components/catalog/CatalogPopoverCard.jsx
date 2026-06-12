import { createElement } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getCategoryIcon } from "../../utils/categoryIcons";

export default function CatalogPopoverCard({ 
  category,
  onClose 
}) {
    return (
      <Link
        to={`/catalog?category=${category.id}`}
        onClick={onClose}
        className="group flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-[#4F8A5B] hover:bg-[#4F8A5B]/5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 group-hover:bg-[#4F8A5B] group-hover:text-white">
            {createElement(getCategoryIcon(category.name), { size: 18 })}
          </span>
          <h3 className="truncate text-sm font-bold text-slate-950 group-hover:text-[#4F8A5B]">
            {category.name}
          </h3>
        </div>
        <ChevronRight size={17} className="shrink-0 text-[#4F8A5B]"/>
      </Link>
    );
}
