import { useParams } from "react-router-dom";
import ProductPage from "../pages/ProductPage";

export default function ProductRoute({
  products = [],
  onAddToCart,
  onToggleFavorite,
  favoriteProductIds = [],
}) {
  const { productId } = useParams();
  const product = products.find((item) => String(item.id) === productId);
  const relatedProducts = products
    .filter((item) => item.id !== product?.id)
    .slice(0, 4);

  return (
    <ProductPage
      product={product}
      relatedProducts={relatedProducts}
      onAddToCart={onAddToCart}
      onToggleFavorite={onToggleFavorite}
      favoriteProductIds={favoriteProductIds}
    />
  );
}
