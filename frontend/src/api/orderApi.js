import { apiClient, resolvestorageUrl } from "./apiClient";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=700&auto=format&fit=crop";

function normalizeOrderItem(item) {
  const product = item.product || {};
  const primaryImage = product.images?.[0]?.image;

  return {
    id: item.id,
    productId: product.id,
    title: product.title || "Deleted product",
    price: Number(item.price ?? product.price ?? 0),
    quantity: item.quantity,
    image: resolvestorageUrl(primaryImage) || FALLBACK_PRODUCT_IMAGE,
  };
}

export function normalizeOrder(order) {
  return {
    id: order.id,
    status: order.status,
    total: Number(order.total_price ?? 0),
    paymentStatus: order.payment_status,
    deliveryStatus: order.delivery_status,
    returnStatus: order.return_status,
    transactionId: order.payment_transaction_id,
    paymentDocument: order.payment_document,
    deliveryAddress: order.delivery_address,
    trackingNumber: order.tracking_number,
    returnReason: order.return_reason,
    date: order.created_at,
    items: (order.items || []).map(normalizeOrderItem),
  };
}

export async function getOrders() {
  const { data } = await apiClient.get("/orders");
  return (data || []).map(normalizeOrder);
}

export async function requestOrderReturn(orderId, reason) {
  const { data } = await apiClient.post(`/orders/${orderId}/returns`, {
    reason,
  });

  return normalizeOrder(data);
}

export async function payOrder(orderId, payload) {
  const { data } = await apiClient.post(`/orders/${orderId}/pay`, {
    transaction_id: payload.transactionId,
    payment_document: payload.paymentDocument,
  });

  return normalizeOrder(data);
}
