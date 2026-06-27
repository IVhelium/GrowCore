export function getOrderDeliveryAddress(order) {
  // Returns the delivery address stored on an order, with a safe fallback.
  const address = String(order?.deliveryAddress || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  return address || "-";
}
