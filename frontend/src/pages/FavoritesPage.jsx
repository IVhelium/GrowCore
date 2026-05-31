import { Link } from "react-router-dom";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHader";
import ProductGrid from "../components/product/ProductGrid";

export default function FavoritesPage({
  products = [],
  onAddToCart,
  onToggleFavorite,
  favoriteProductIds = [],
}) {
  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Favorites"
          title="Saved products"
          text="Products you marked for later."
        />

        {products.length ? (
          <ProductGrid
            products={products}
            onAddToCart={onAddToCart}
            onToggleFavorite={onToggleFavorite}
            favoriteProductIds={favoriteProductIds}
          />
        ) : (
          <>
            <EmptyState
              title="No saved products"
              text="Use the heart button on a product card to save it here."
            />
            <div className="mt-4 text-center">
              <Link className="font-semibold text-[#4F8A5B]" to="/catalog">
                Open catalog
              </Link>
            </div>
          </>
        )}
      </Container>
    </main>
  );
}
