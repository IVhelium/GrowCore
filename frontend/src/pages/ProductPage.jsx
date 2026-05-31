import Container from "../components/common/Container";
import ProductGrid from "../components/product/ProductGrid";
import { formatPrice } from "../utils/formatPrice";

export default function ProductPage({
  product,
  relatedProducts = [],
  onAddToCart,
  onToggleFavorite,
  favoriteProductIds = [],
}) {
  if (!product) {
    return (
      <main>
        <Container className="py-10">Product not found</Container>
      </main>
    );
  }

  const isFavorite = favoriteProductIds.includes(String(product.id));

  return (
    <main>
      <Container className="space-y-10 py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid aspect-square place-content-center overflow-hidden rounded-xl bg-slate-50">
              <img
                src={product.image}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#4F8A5B]">
              Product
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">
              {product.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {product.description}
            </p>

            <div className="mt-6 flex items-end gap-3">
              <span className="text-3xl font-black text-slate-950">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="text-lg text-slate-400 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onAddToCart?.(product)}
                className="rounded-lg bg-[#4F8A5B] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3F7148]"
              >
                Add to cart
              </button>
              <button
                type="button"
                onClick={() => onToggleFavorite?.(product)}
                className={`rounded-lg border px-6 py-3 text-sm font-semibold transition ${
                  isFavorite
                    ? "border-[#4F8A5B] bg-[#4F8A5B] text-white hover:bg-[#3F7148]"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
                }`}
              >
                {isFavorite ? "Saved" : "Save product"}
              </button>
            </div>
          </section>
        </div>

        {relatedProducts.length > 0 && (
          <section>
            <h2 className="mb-5 text-2xl font-bold text-slate-950">
              Related products
            </h2>
            <ProductGrid
              products={relatedProducts}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
          </section>
        )}
      </Container>
    </main>
  );
}
