import { apiClient, resolvestorageUrl } from "./apiClient";
import { normalizeCart } from "./cartApi";

const FAVORITES_LIST_LIMIT = 100;
const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=700&auto=format&fit=crop";

function normalizeFavoriteProduct(favorite) {
  const product = favorite.product || {};
  const primaryImage = product.images?.[0]?.image;

  return {
    id: product.id,
    favoriteId: favorite.id,
    title: product.title,
    description: product.description || "",
    price: Number(product.price),
    oldPrice: null,
    label: "Product",
    category: "",
    image: resolvestorageUrl(primaryImage) || FALLBACK_PRODUCT_IMAGE,
    rating: Number(product.rating_avg ?? 0),
    ratingCount: product.rating_count ?? 0,
    quantity: product.quantity,
    raw: product,
  };
}

export async function getFavorites({
  limit = FAVORITES_LIST_LIMIT,
  offset = 0,
} = {}) {
  const { data } = await apiClient.get("/favorites", {
    params: {
      limit,
      offset,
    },
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeFavoriteProduct),
  };
}

export async function addFavorite(productId) {
  const { data } = await apiClient.post("/favorites", {
    product_id: productId,
  });

  return normalizeFavoriteProduct(data);
}

export async function removeFavorite(favoriteId) {
  await apiClient.delete(`/favorites/${favoriteId}`);
}

export async function moveFavoriteToCart(favoriteId, quantity = 1) {
  const { data } = await apiClient.post(`/favorites/${favoriteId}/move-to-cart`, {
    quantity,
  });

  return normalizeCart(data);
}
