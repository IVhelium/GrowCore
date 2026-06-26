export const RECEIPT_ISSUER = {
  name: "GrowCore Marketplace",
  address: "Online marketplace",
  taxId: "Not provided",
  email: "support@growcore.local",
};

export function cleanAddress(value) {
  // Removes empty address parts and joins the remaining parts for a receipt.
  const text = String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part !== "-")
    .join(", ");

  return text || "-";
}

export function money(value) {
  // Formats a numeric value as a two-decimal euro amount.
  return `${Number(value || 0).toFixed(2)} EUR`;
}

export function createReceiptModel({
  paymentId,
  orderId,
  user,
  items = [],
  total,
  companyFeeTotal,
  method,
  paidAt,
  deliveryAddress,
  customerNif,
}) {
  // Converts payment and order data into one consistent receipt object.
  return {
    receiptNumber: `GC-${orderId || "ORDER"}-${String(paymentId || "PAYMENT").slice(-8)}`,
    orderId: orderId || "-",
    paymentId: paymentId || "-",
    customerName: user?.username || "Customer",
    customerEmail: user?.email || "-",
    customerNif: customerNif || "-",
    method: method || "Stripe",
    paidAt: paidAt || "-",
    deliveryAddress: cleanAddress(deliveryAddress),
    items,
    total: Number(total || 0),
    companyFeeTotal: Number(companyFeeTotal || 0),
  };
}
