import { formatPrice } from "./formatPrice";

export function createPaymentDocument({
  paymentId,
  user,
  items = [],
  total,
  method,
  paidAt,
}) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td>${item.title}</td>
          <td>${item.quantity}</td>
          <td>${formatPrice(item.price)}</td>
          <td>${formatPrice(item.price * item.quantity)}</td>
        </tr>
      `,
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>GrowCore Payment Receipt</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #0f172a;
            padding: 32px;
          }

          h1 {
            color: #4F8A5B;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 24px;
          }

          th, td {
            border: 1px solid #e2e8f0;
            padding: 10px;
            text-align: left;
          }

          th {
            background: #f8fafc;
          }

          .total {
            margin-top: 24px;
            font-size: 20px;
            font-weight: bold;
          }
        </style>
      </head>

      <body>
        <h1>GrowCore Payment Receipt</h1>

        <p><strong>Payment ID:</strong> ${paymentId}</p>
        <p><strong>User:</strong> ${user?.username || "Customer"}</p>
        <p><strong>Email:</strong> ${user?.email || "-"}</p>
        <p><strong>Payment method:</strong> ${method}</p>
        <p><strong>Paid at:</strong> ${paidAt}</p>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>

        <p class="total">Total paid: ${formatPrice(total)}</p>
      </body>
    </html>
  `;
}

export function downloadPaymentDocument(documentHtml, fileName) {
  const blob = new Blob([documentHtml], {
    type: "text/html;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
