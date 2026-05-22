import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CatalogPopoverCard({ 
  category,
  onClose 
}) {
    return (
      <Link
        to={`/catalog?category=${category.id}`}
        onClick={onClose}
        className="group block overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:border-[#4F8A5B] hover:shadow-md"
      >
        <div className="aspect-4/3 overflow-hidden bg-slate-100">
          <img
            src={category.image}
            alt={category.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <h3 className="text-sm font-bold text-slate-950 group-hover:text-[#4F8A5B]">
            {category.name}
          </h3>
          <ChevronRight size={17} className="text-[#4F8A5B]"/>
        </div>
      </Link>
    );
}