import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  createProductReview,
  createProductReviewReply,
  deleteProductReview,
  getProduct,
} from "../api/productApi";
import ProductPage from "../pages/ProductPage";
import { useAuth } from "../hooks/useAuth";
import { showToast } from "../utils/showToast";

export default function ProductRoute({
  products = [],
  onAddToCart,
  onToggleFavorite,
  favoriteProductIds = [],
}) {
  // Loads the selected product and connects product-page actions to API functions.
  const { productId } = useParams();
  const { user } = useAuth();
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

        if (isActive) { // Avoids state updates after the route component unmounts.
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
    // Shows up to four other products while excluding the product currently open.
    () =>
      products
        .filter((item) => String(item.id) !== String(product?.id || productId))
        .slice(0, 4),
    [product?.id, productId, products],
  );

  async function handleReviewSubmit(payload) {
    // Creates a review and refreshes the page with the updated product data.
    const updatedProduct = await createProductReview(productId, payload);
    setProduct(updatedProduct);
    showToast("Review added", "success");
    return updatedProduct;
  }

  async function handleReviewReply(reviewId, payload) {
    // Creates a reply and refreshes the review list with the API response.
    const updatedProduct = await createProductReviewReply(
      productId,
      reviewId,
      payload,
    );
    setProduct(updatedProduct);
    showToast("Reply added", "success");
    return updatedProduct;
  }

  async function handleReviewDelete(reviewId) {
    const updatedProduct = await deleteProductReview(productId, reviewId);
    setProduct(updatedProduct);
    showToast("Review deleted", "success");
    return updatedProduct;
  }

  return (
    <ProductPage
      product={product}
      relatedProducts={relatedProducts}
      isLoading={isProductLoading}
      error={productError}
      onAddToCart={onAddToCart}
      onToggleFavorite={onToggleFavorite}
      onReviewSubmit={handleReviewSubmit}
      onReviewReply={handleReviewReply}
      onReviewDelete={handleReviewDelete}
      currentUser={user}
      favoriteProductIds={favoriteProductIds}
    />
  );
}
