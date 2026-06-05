import { apiClient, getPaginationParams, resolvestorageUrl } from "./apiClient";

const PRODUCT_LIST_LIMIT = 100;

export function normalizeProduct(product) {
  const primaryImage = product.images?.[0]?.image;
  const images = (product.images || [])
    .map((item) => resolvestorageUrl(item.image))
    .filter(Boolean);

  return {
    id: product.id,
    categoryId: product.category?.id ?? null,
    title: product.title,
    description: product.description,
    price: Number(product.price),
    oldPrice: null,
    label: product.category?.name || "Product",
    category: product.category?.name || "",
    image: images[0] ||
      resolvestorageUrl(primaryImage) ||
      "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=700&auto=format&fit=crop",
    images,
    rating: Number(product.rating_avg ?? 0),
    ratingCount: product.rating_count ?? 0,
    quantity: product.quantity,
    enabled: product.enabled,
    moderationStatus: product.moderation_status,
    rejectionReason: product.rejection_reason,
    store: product.store || null,
    reviews: (product.reviews || []).map((review) => ({
      id: review.id,
      rating: Number(review.rating ?? 0),
      text: review.comment || "",
      date: review.created_at,
      user: review.user?.username || "GrowCore user",
    })),
    raw: product,
  };
}

export async function getProducts({
  limit = PRODUCT_LIST_LIMIT,
  offset = 0,
  search,
  categoryId,
} = {}) {
  const { data } = await apiClient.get("/products", {
    params: {
      ...getPaginationParams({ limit, offset }),
      search: search || undefined,
      category_id: categoryId || undefined,
    },
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeProduct),
  };
}

export async function getProduct(productId) {
  const { data } = await apiClient.get(`/products/${productId}`);
  return normalizeProduct(data);
}

export async function getPendingProducts({ limit = 20, offset = 0 } = {}) {
  const { data } = await apiClient.get("/admin/products/moderation", {
    params: getPaginationParams({ limit, offset }),
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeProduct),
  };
}

export async function approveProduct(productId) {
  const { data } = await apiClient.patch(
    `/admin/products/moderation/${productId}/approve`,
  );

  return normalizeProduct(data);
}

export async function rejectProduct(productId, reason) {
  const { data } = await apiClient.patch(
    `/admin/products/moderation/${productId}/reject`,
    { reason },
  );

  return normalizeProduct(data);
}

export async function getMySellerProducts({ limit = 20, offset = 0 } = {}) {
  const { data } = await apiClient.get("/seller/products", {
    params: getPaginationParams({ limit, offset }),
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeProduct),
  };
}

export async function getMySellerProduct(productId) {
  const { data } = await apiClient.get(`/seller/products/${productId}`);
  return normalizeProduct(data);
}

export async function createSellerProduct(payload) {
  const { data } = await apiClient.post("/seller/products", {
    title: payload.title,
    description: payload.description,
    price: Number(payload.price),
    quantity: Number(payload.quantity),
    category_id: Number(payload.categoryId),
  });

  return normalizeProduct(data);
}

export async function updateSellerProduct(productId, payload) {
  const body = {
    title: payload.title || undefined,
    description: payload.description || undefined,
    price: payload.price === "" ? undefined : Number(payload.price),
    quantity: payload.quantity === "" ? undefined : Number(payload.quantity),
    category_id: payload.categoryId ? Number(payload.categoryId) : undefined,
  };

  const { data } = await apiClient.patch(`/seller/products/${productId}`, body);
  return normalizeProduct(data);
}

export async function uploadSellerProductImage(productId, file) {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await apiClient.post(
    `/seller/products/${productId}/images`,
    formData,
  );

  return normalizeProduct(data);
}

export async function submitSellerProduct(productId) {
  const { data } = await apiClient.post(`/seller/products/${productId}/submit`);
  return normalizeProduct(data);
}
