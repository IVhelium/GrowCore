import { apiClient, resolvestorageUrl } from "./apiClient";

function normalizeCartItem(item) {
  // Converts backend cart fields into the simpler field names used by the UI.
  const product = item.product || {};
  const primaryImage = product.images?.[0]?.image;

  return {
    id: item.id,
    productId: product.id,
    title: product.title,
    price: Number(product.discounted_price ?? product.price),
    originalPrice: Number(product.price),
    discountPercent: Number(product.discount_percent || 0),
    discountExpiresAt: product.discount_expires_at || null,
    hasDiscount: Boolean(product.has_discount),
    oldPrice: product.has_discount
      ? Number(product.price)
      : null,
    quantity: item.quantity,
    maxQuantity: product.quantity,
    image: resolvestorageUrl(primaryImage) || "",
    product,
  };
}

export function normalizeCart(cart) {
  // Normalizes every cart item and keeps them in a stable display order.
  return {
    id: cart.id,
    items: (cart.items || [])
      .map(normalizeCartItem)
      .sort((firstItem, secondItem) => firstItem.id - secondItem.id),
  };
}

export async function getCart() {
  // Loads the signed-in user's current cart.
  const { data } = await apiClient.get("/cart");
  return normalizeCart(data);
}

export async function addCartItem(productId, quantity = 1) {
  // Adds a product to the cart with the selected quantity.
  const { data } = await apiClient.post("/cart/items", {
    product_id: productId,
    quantity,
  });

  return normalizeCart(data);
}

export async function updateCartItem(itemId, quantity) {
  // Changes the quantity of one existing cart item.
  const { data } = await apiClient.patch(`/cart/items/${itemId}`, {
    quantity,
  });

  return normalizeCart(data);
}

export async function removeCartItem(itemId) {
  // Removes one product row from the cart.
  const { data } = await apiClient.delete(`/cart/items/${itemId}`);
  return normalizeCart(data);
}

export async function checkoutCart() {
  // Creates a pending order from the current cart.
  const { data } = await apiClient.post("/cart/checkout", {});
  return normalizeCart(data);
}
