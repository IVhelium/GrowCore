import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/common/Button";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHader";
import ProductGrid from "../components/product/ProductGrid";

export default function FavoritesPage({
  products = [],
  onAddToCart,
  onToggleFavorite,
  onMoveAllToCart,
  favoriteProductIds = [],
}) {
  const [isMoving, setIsMoving] = useState(false);

  async function handleMoveAllToCart() {
    setIsMoving(true);

    try {
      await onMoveAllToCart?.();
    } finally {
      setIsMoving(false);
    }
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Favorites"
          title="Saved products"
          text="Products you marked for later."
        />

        {products.length ? (
          <>
            <div className="mb-5 flex justify-end">
              <Button onClick={handleMoveAllToCart} disabled={isMoving}>
                <ShoppingBag size={17} />
                {isMoving ? "Moving..." : "Move all to cart"}
              </Button>
            </div>

            <ProductGrid
              products={products}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
          </>
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
