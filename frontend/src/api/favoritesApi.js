import { apiClient, getPaginationParams, resolvestorageUrl } from "./apiClient";
import { normalizeCart } from "./cartApi";

const FAVORITES_LIST_LIMIT = 100;

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
    image: resolvestorageUrl(primaryImage) || "",
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
    params: getPaginationParams({ limit, offset }),
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
