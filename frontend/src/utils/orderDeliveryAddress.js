export function getOrderDeliveryAddress(order) {
  const address = String(order?.deliveryAddress || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");

  return address || "-";
}
