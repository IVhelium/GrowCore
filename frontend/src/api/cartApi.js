import { apiClient, resolvestorageUrl } from "./apiClient";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=700&auto=format&fit=crop";

function normalizeCartItem(item) {
  const product = item.product || {};
  const primaryImage = product.images?.[0]?.image;

  return {
    id: item.id,
    productId: product.id,
    title: product.title,
    price: Number(product.price),
    quantity: item.quantity,
    maxQuantity: product.quantity,
    image: resolvestorageUrl(primaryImage) || FALLBACK_PRODUCT_IMAGE,
    product,
  };
}

export function normalizeCart(cart) {
  return {
    id: cart.id,
    items: (cart.items || [])
      .map(normalizeCartItem)
      .sort((firstItem, secondItem) => firstItem.id - secondItem.id),
  };
}

export async function getCart() {
  const { data } = await apiClient.get("/cart");
  return normalizeCart(data);
}

export async function addCartItem(productId, quantity = 1) {
  const { data } = await apiClient.post("/cart/items", {
    product_id: productId,
    quantity,
  });

  return normalizeCart(data);
}

export async function updateCartItem(itemId, quantity) {
  const { data } = await apiClient.patch(`/cart/items/${itemId}`, {
    quantity,
  });

  return normalizeCart(data);
}

export async function removeCartItem(itemId) {
  const { data } = await apiClient.delete(`/cart/items/${itemId}`);
  return normalizeCart(data);
}

export async function checkoutCart(deliveryAddress) {
  const { data } = await apiClient.post("/cart/checkout", {
    delivery_address: deliveryAddress,
  });
  return normalizeCart(data);
}
