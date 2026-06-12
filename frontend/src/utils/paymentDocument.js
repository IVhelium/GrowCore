import { formatPrice } from "./formatPrice";

function stripHtml(value) {
  const element = document.createElement("div");
  element.innerHTML = value;

  return (element.textContent || element.innerText || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function sanitizePdfText(value) {
  return String(value)
    .replace(/[€]/g, "EUR")
    .replace(/[^\u0020-\u007E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function createPdfFromText(text) {
  const lines = text
    .split(/\r?\n/)
    .flatMap((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return [""];

      const chunks = [];
      for (let index = 0; index < trimmedLine.length; index += 88) {
        chunks.push(trimmedLine.slice(index, index + 88));
      }
      return chunks;
    })
    .slice(0, 42);

  const stream = [
    "BT",
    "/F1 12 Tf",
    "50 790 Td",
    "16 TL",
    ...lines.map((line) => `(${sanitizePdfText(line)}) Tj T*`),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

export function createPaymentDocument({
  paymentId,
  user,
  items = [],
  total,
  method,
  paidAt,
  deliveryAddress,
  customerNif,
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
        <p><strong>NIF:</strong> ${customerNif || "-"}</p>
        <p><strong>Paid at:</strong> ${paidAt}</p>
        <p><strong>Delivery address:</strong> ${deliveryAddress || "-"}</p>

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
  const text = stripHtml(documentHtml);
  const pdf = createPdfFromText(text);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
