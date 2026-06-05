import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getProduct } from "../api/productApi";
import ProductPage from "../pages/ProductPage";

export default function ProductRoute({
  products = [],
  onAddToCart,
  onToggleFavorite,
  favoriteProductIds = [],
}) {
  const { productId } = useParams();
  const fallbackProduct = products.find((item) => String(item.id) === productId);
  const [product, setProduct] = useState(fallbackProduct || null);
  const [isProductLoading, setIsProductLoading] = useState(true);
  const [productError, setProductError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadProduct() {
      setIsProductLoading(true);
      setProductError(null);

      try {
        const loadedProduct = await getProduct(productId);

        if (isActive) {
          setProduct(loadedProduct);
        }
      } catch (error) {
        if (isActive) {
          setProductError(error);
          setProduct(fallbackProduct || null);
        }
      } finally {
        if (isActive) {
          setIsProductLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isActive = false;
    };
  }, [fallbackProduct, productId]);

  const relatedProducts = useMemo(
    () =>
      products
        .filter((item) => String(item.id) !== String(product?.id || productId))
        .slice(0, 4),
    [product?.id, productId, products],
  );

  return (
    <ProductPage
      product={product}
      relatedProducts={relatedProducts}
      isLoading={isProductLoading}
      error={productError}
      onAddToCart={onAddToCart}
      onToggleFavorite={onToggleFavorite}
      favoriteProductIds={favoriteProductIds}
    />
  );
}
