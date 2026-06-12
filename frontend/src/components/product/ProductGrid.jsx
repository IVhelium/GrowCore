import EmptyState from "../common/EmptyState";
import ProductCard from "./ProductCard";

export default function ProductGrid({
    products = [],
    onAddToCart,
    onToggleFavorite,
    favoriteProductIds = [],
}) {
    const favoriteIdSet = new Set(
        favoriteProductIds.map((productId) => String(productId)),
    );

  if (!products.length) {
    return (
      <EmptyState
        title="No products found"
        text="Try changing the search query, filters, or category"
        actionText="Reset filters"
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onToggleFavorite={onToggleFavorite}
          isFavorite={favoriteIdSet.has(String(product.id))}
        />
      ))}
    </div>
  );
}
