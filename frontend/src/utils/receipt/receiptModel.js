export const RECEIPT_ISSUER = {
  name: "GrowCore Marketplace",
  address: "Online marketplace",
  taxId: "Not provided",
  email: "support@growcore.local",
};

export function cleanAddress(value) {
  const text = String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part !== "-")
    .join(", ");

  return text || "-";
}

export function money(value) {
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
