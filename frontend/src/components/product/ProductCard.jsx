import { Heart, ShoppingBag, Star } from "lucide-react";
import { Link } from "react-router-dom";
import ImageWithFallback from "../common/ImageWithFallback";
import { formatPrice } from "../../utils/formatPrice";

export default function ProductCard({
  product,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
}) {
  const favoriteColor = "#4F8A5B";

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative bg-slate-50 p-5">
        {product.label && (
          <div className="absolute left-5 top-5 z-10 max-w-[calc(100%-5rem)] truncate rounded-lg bg-white px-3 py-1 text-xs font-semibold text-[#4F8A5B] shadow-sm">
            {product.label}
          </div>
        )}

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleFavorite?.(product);
          }}
          className="group/favorite absolute right-5 top-5 z-10 rounded-lg bg-white p-2 shadow-sm transition"
          style={{ color: isFavorite ? favoriteColor : "#94a3b8" }}
        >
          <Heart
            size={18}
            className="transition group-hover/favorite:text-[#4F8A5B] group-hover/favorite:fill-[#4F8A5B]"
            stroke="currentColor"
            fill={isFavorite ? favoriteColor : "transparent"}
          />
        </button>

        <Link
          to={`/product/${product.id}`}
          className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white"
        >
          <ImageWithFallback
            src={product.image}
            alt={product.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            iconSize={38}
          />
        </Link>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-1 text-sm text-amber-500">
          <Star size={15} fill="currentColor" />
          <span className="font-semibold">{product.rating}</span>
        </div>

        <Link to={`/product/${product.id}`}>
          <h3 className="product-card-title text-lg font-semibold text-slate-950 transition hover:text-[#4F8A5B]">
            {product.title}
          </h3>
        </Link>

        <p className="product-card-description mt-2 min-h-10 text-sm leading-5 text-slate-500">
          {product.description}
        </p>

        {/* Sale */}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="min-w-0">
            {product.oldPrice && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-400 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
                <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-600">
                  -{product.discountPercent}%
                </span>
              </div>
            )}
            <div className="truncate text-xl font-bold text-slate-950">
              {formatPrice(product.price)}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-[#4F8A5B] px-4 text-sm font-semibold text-white transition hover:bg-[#3F7148]"
          >
            <ShoppingBag size={17} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </article>
  );
}
