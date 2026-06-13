import { RECEIPT_ISSUER, createReceiptModel, money } from "./receiptModel";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createPaymentDocument(receiptInput) {
  const receipt = createReceiptModel(receiptInput);
  const rows = receipt.items
    .map((item, index) => {
      const quantity = Number(item.quantity || 0);
      const unit = Number(item.price || 0);

      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.title || "Product")}</td>
          <td>${quantity}</td>
          <td>${money(unit)}</td>
          <td>${money(unit * quantity)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html>
      <head><meta charset="utf-8" /><title>GrowCore Payment Receipt</title></head>
      <body>
        <h1>GrowCore Payment Receipt</h1>
        <h2>Payment Receipt / Proof of Payment</h2>
        <p><strong>Receipt No:</strong> ${escapeHtml(receipt.receiptNumber)}</p>
        <p><strong>Order:</strong> #${escapeHtml(receipt.orderId)}</p>
        <p><strong>Payment ID:</strong> ${escapeHtml(receipt.paymentId)}</p>
        <p><strong>Paid at:</strong> ${escapeHtml(receipt.paidAt)}</p>
        <p><strong>Payment method:</strong> ${escapeHtml(receipt.method)}</p>
        <h3>Issuer</h3>
        <p>${escapeHtml(RECEIPT_ISSUER.name)}</p>
        <p>${escapeHtml(RECEIPT_ISSUER.address)}</p>
        <p><strong>Tax ID:</strong> ${escapeHtml(RECEIPT_ISSUER.taxId)}</p>
        <h3>Buyer</h3>
        <p><strong>Name:</strong> ${escapeHtml(receipt.customerName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(receipt.customerEmail)}</p>
        <p><strong>NIF / Tax ID:</strong> ${escapeHtml(receipt.customerNif)}</p>
        <p><strong>Delivery address:</strong> ${escapeHtml(receipt.deliveryAddress)}</p>
        <table>
          <thead>
            <tr><th>#</th><th>Product</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p><strong>Net amount:</strong> ${money(receipt.total - receipt.total * 23 / 123)}</p>
        <p><strong>IVA 23% included:</strong> ${money(receipt.total * 23 / 123)}</p>
        <p><strong>Total paid:</strong> ${money(receipt.total)}</p>
      </body>
    </html>
  `;
}
