import { apiClient, getPaginationParams, resolvestorageUrl } from "./apiClient";

const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1495107334309-fcf20504a5ab?q=80&w=700&auto=format&fit=crop";

function normalizeOrderItem(item) {
  // Converts one backend order item into the data needed by an order card.
  const product = item.product || {};
  const primaryImage = product.images?.[0]?.image;

  return {
    id: item.id,
    productId: product.id,
    title: product.title || "Deleted product",
    price: Number(item.price ?? product.price ?? 0),
    quantity: item.quantity,
    companyFee: Number(item.company_fee ?? 0),
    sellerAmount: Number(item.seller_amount ?? 0),
    image: resolvestorageUrl(primaryImage) || FALLBACK_PRODUCT_IMAGE,
  };
}

export function normalizeOrder(order) {
  // Converts backend order fields into consistent names for frontend components.
  return {
    id: order.id,
    status: order.status,
    total: Number(order.total_price ?? 0),
    companyFeeTotal: Number(order.company_fee_total ?? 0),
    paymentStatus: order.payment_status,
    deliveryStatus: order.delivery_status,
    returnStatus: order.return_status,
    transactionId: order.payment_transaction_id,
    paymentMethod: order.payment_method,
    customerNif: order.customer_nif,
    paymentDocument: order.payment_document,
    deliveryAddress: order.delivery_address,
    trackingNumber: order.tracking_number,
    returnReason: order.return_reason,
    date: order.created_at,
    userId: order.user_id,
    items: (order.items || []).map(normalizeOrderItem),
  };
}

export async function getOrders() {
  // Loads the current user's complete order history.
  const { data } = await apiClient.get("/orders");
  return (data || []).map(normalizeOrder);
}

export async function getAdminTransactions({
  limit = 20,
  offset = 0,
  paymentStatus,
} = {}) {
  // Loads paginated transactions for the admin panel, optionally by payment state.
  const { data } = await apiClient.get("/orders/admin/transactions", {
    params: {
      ...getPaginationParams({ limit, offset }),
      payment_status: paymentStatus || undefined,
    },
  });

  return {
    ...data,
    items: (data.items || []).map(normalizeOrder),
  };
}

export async function confirmStripeCheckout(sessionId) {
  // Confirms a finished Stripe Checkout session and receives the updated order.
  const { data } = await apiClient.post("/orders/stripe/confirm", null, {
    params: {
      session_id: sessionId,
    },
  });

  return normalizeOrder(data);
}

export async function requestOrderReturn(orderId, reason) {
  // Sends a customer request to return an order with a written reason.
  const { data } = await apiClient.post(`/orders/${orderId}/returns`, {
    reason,
  });

  return normalizeOrder(data);
}

export async function deleteOrder(orderId) {
  // Deletes an order only when backend business rules allow it.
  await apiClient.delete(`/orders/${orderId}`);
}

export async function createStripeCheckout(orderId, payload = {}) {
  // Creates a Stripe Checkout session and returns the address to open in the browser.
  const { data } = await apiClient.post(`/orders/${orderId}/stripe-checkout`, {
    delivery_address: payload.deliveryAddress || undefined,
    customer_nif: payload.customerNif || undefined,
  });

  return data;
}
