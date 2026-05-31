import { apiClient, resolvestorageUrl } from "./apiClient";

const PRODUCT_LIST_LIMIT = 100;

function normalizeProduct(product) {
  const primaryImage = product.images?.[0]?.image;

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: Number(product.price),
    oldPrice: null,
    label: product.category?.name || "Product",
    category: product.category?.name || "",
    image:
      resolvestorageUrl(primaryImage) ||
      "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=700&auto=format&fit=crop",
    rating: Number(product.rating_avg ?? 0),
    ratingCount: product.rating_count ?? 0,
    quantity: product.quantity,
    raw: product,
  };
}

export async function getProducts({ limit = PRODUCT_LIST_LIMIT, offset = 0 } = {}) {
  const { data } = await apiClient.get("/products", {
    params: {
      limit,
      offset,
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
