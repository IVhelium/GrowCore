import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";


export default function CategoryCard({ category }) {
    return (
      <Link
        to={`/catalog?category=${category.id}`}
        className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:translate-y-1 hover:shadow-xl"
      >
        <div className="aspect-4/3 overflow-hidden bg-slate-100">
          <img
            src={category.image}
            alt={category.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>

        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <h3 className="font-bold leading-tight text-slate-950 group-hover:text-[#4F8A5B]">
              {category.name}
            </h3>
            <p className="mt-1 text-sm text-slate-500">Explore parts</p>
          </div>
          <ChevronRight className="shrink-0 text-[#4F8A5B] transition group-hover:translate-x-1" size={19}/>
        </div>
      </Link>
    );
}