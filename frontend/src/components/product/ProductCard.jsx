import { Heart, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { formatPrice } from "../../utils/formatPrice";

export default function ProductCard({
  product,
  onAddToCart,
  onToggleFavorite,
}) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative bg-slate-50 p-5">
        {product.label && (
          <div className="absolute left-5 top-5 z-10 rounded-lg bg-white px-3 py-1 text-xs font-semibold text-[#4F8A5B] shadow-sm">
            {product.label}
          </div>
        )}

        <button
          type="button"
          onClick={() => onToggleFavorite?.(product)}
          aria-label="Add to favorites"
          className="absolute right-5 top-5 z-10 rounded-lg bg-white p-2 text-slate-400 shadow-sm transition hover:text-[#4F8A5B]"
        >
          <Heart size={18} />
        </button>

        <Link
          to={`/products/${product.id}`}
          className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white"
        >
          <img
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </Link>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-1 text-sm text-amber-500">
          <Star size={15} fill="currentColor" />
          <span className="font-semibold">{product.rating}</span>
        </div>

        <Link to={`/products/${product.id}`}>
          <h3 className="text-lg font-semibold text-slate-950 transition hover:text-[#4F8A5B]">
            {product.title}
          </h3>
        </Link>

        <p className="mt-2 min-h-10 text-sm leading-5 text-slate-500">
          {product.description}
        </p>

        {/* Sale */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            {product.oldPrice && (
              <div className="text-sm text-slate-400 line-through">
                {formatPrice(product.oldPrice)}
              </div>
            )}
            <div className="text-xl font-bold text-slate-950">
              {formatPrice(product.price)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#4F8A5B] px-4 text-sm font-semibold text-white transition hover:bg-[#3F7148]"
          >
            <ShoppingBag size={17} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}
