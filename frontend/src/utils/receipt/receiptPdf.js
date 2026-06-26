import { RECEIPT_ISSUER, createReceiptModel, money } from "./receiptModel";

function stripHtml(value) {
  // Converts receipt HTML to plain text when only HTML input is available.
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
  // Removes unsupported characters and escapes PDF control characters.
  return String(value ?? "")
    .replace(/[^\u0020-\u007E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapText(value, width) {
  // Splits long text into fixed-width lines for the PDF layout.
  const words = String(value || "-").split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    if (word.length > width) { // Splits one very long word that cannot fit on a line.
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
      for (let index = 0; index < word.length; index += width) {
        lines.push(word.slice(index, index + width));
      }
      return;
    }

    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > width) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) lines.push(currentLine);

  return lines.length ? lines : ["-"];
}

function pad(value, width, align = "left") {
  // Trims or pads text so receipt columns keep the same width.
  const text = String(value ?? "");
  const trimmed = text.length > width ? `${text.slice(0, width - 1)}.` : text;

  return align === "right"
    ? trimmed.padStart(width, " ")
    : trimmed.padEnd(width, " ");
}

function pdfLine(text, x, y, size = 9) {
  // Creates one raw PDF command that writes a line of text at coordinates.
  return `BT /F1 ${size} Tf ${x} ${y} Td (${sanitizePdfText(text)}) Tj ET`;
}

function buildReceiptLines(receipt) {
  // Builds all visible text lines, totals, and item rows for a receipt.
  const subtotal = receipt.items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const iva = receipt.total * 23 / 123;
  const net = receipt.total - iva;
  const lines = [
    "      GROWCORE MARKETPLACE",
    "      PAYMENT RECEIPT / PROOF OF PAYMENT",
    "",
    `Receipt No: ${receipt.receiptNumber}`,
    `Order: #${receipt.orderId}`,
    `Payment ID: ${receipt.paymentId}`,
    `Paid at: ${receipt.paidAt}`,
    `Payment method: ${receipt.method}`,
    "",
    "ISSUER",
    `Name: ${RECEIPT_ISSUER.name}`,
    `Address: ${RECEIPT_ISSUER.address}`,
    `Tax ID: ${RECEIPT_ISSUER.taxId}`,
    `Email: ${RECEIPT_ISSUER.email}`,
    "",
    "BUYER",
    `Name: ${receipt.customerName}`,
    `Email: ${receipt.customerEmail}`,
    `NIF / Tax ID: ${receipt.customerNif}`,
    ...wrapText(`Delivery address: ${receipt.deliveryAddress}`, 92),
    "",
    "ITEMS",
    "----------------------------------------------------------------------------------------------",
    `${pad("#", 4, "right")}${pad("Product", 44)}${pad("Qty", 8, "right")}${pad("Unit", 16, "right")}${pad("Line total", 20, "right")}`,
    "----------------------------------------------------------------------------------------------",
  ];

  receipt.items.forEach((item, index) => {
    const quantity = Number(item.quantity || 0);
    const unit = Number(item.price || 0);
    const productLines = wrapText(item.title || "Product", 42);

    lines.push(
      `${pad(index + 1, 4, "right")}${pad(productLines[0], 44)}${pad(quantity, 8, "right")}${pad(money(unit), 16, "right")}${pad(money(unit * quantity), 20, "right")}`,
    );

    productLines.slice(1).forEach((productLine) => {
      lines.push(`${pad("", 4)}${pad(productLine, 44)}${pad("", 8)}${pad("", 16)}${pad("", 20)}`);
    });
  });

  lines.push(
    "----------------------------------------------------------------------------------------------",
    `${pad("Subtotal", 68)}${pad(money(subtotal), 24, "right")}`,
    `${pad("Net amount", 68)}${pad(money(net), 24, "right")}`,
    `${pad("IVA 23% included", 68)}${pad(money(iva), 24, "right")}`,
    `${pad("TOTAL PAID", 68)}${pad(money(receipt.total), 24, "right")}`,
    "",
    "NOTES",
    "This document is a payment receipt/proof of payment generated from Stripe payment data.",
    "For Portuguese IRS or VAT reporting, retain seller tax invoices where legally required.",
    "GrowCore does not certify this document as a fiscal invoice unless tax/VAT data is configured.",
  );

  return lines;
}

function createPdfFromReceipt(receipt) {
  // Creates a minimal one-page PDF document without an external PDF library.
  const visibleLines = buildReceiptLines(receipt).slice(0, 64);
  const content = [
    "0.29 0.54 0.36 rg",
    "34 785 32 32 re f",
    "1 1 1 rg",
    pdfLine("GC", 42, 797, 13),
    "0 0 0 rg",
    ...visibleLines.map((line, index) =>
      pdfLine(line, 34, 806 - index * 12, index < 2 ? 11 : 8.5),
    ),
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
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

export function downloadPaymentDocument(documentHtml, fileName, receiptInput = null) {
  // Generates the PDF, starts the browser download, and releases temporary memory.
  const receipt = receiptInput
    ? createReceiptModel(receiptInput)
    : createReceiptModel({
        paymentId: "-",
        orderId: "-",
        deliveryAddress: stripHtml(documentHtml),
      });
  const pdf = createPdfFromReceipt(receipt);
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
