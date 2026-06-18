from decimal import Decimal
from html import escape

from src.models import OrderModel


def create_payment_document(order: OrderModel, session: dict) -> str:
    rows = []
    for index, item in enumerate(order.items, start=1):
      title = escape(item.product.title if item.product else f"Product #{item.product_id}")
      line_total = Decimal(item.price) * item.quantity
      rows.append(
        "<tr>"
        f"<td>{index}</td>"
        f"<td>{title}</td>"
        f"<td>{item.quantity}</td>"
        f"<td>{item.price}</td>"
        f"<td>{line_total}</td>"
        "</tr>"
      )

    customer_details = session.get("customer_details") or {}
    receipt_email = escape(customer_details.get("email") or "")
    receipt_name = escape(customer_details.get("name") or "Customer")
    receipt_number = f"GC-{order.id}-{session['id'][-8:]}"
    delivery_address = escape(order.delivery_address or "-")
    iva_amount = (order.total_price * Decimal("23") / Decimal("123")).quantize(Decimal("0.01"))
    net_amount = order.total_price - iva_amount

    return f"""
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>GrowCore Payment Receipt</title>
    <style>
      body {{ font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }}
      h1 {{ color: #4F8A5B; margin-bottom: 4px; }}
      h2 {{ margin-top: 0; color: #334155; }}
      .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 24px 0; }}
      .box {{ border: 1px solid #d9e4dc; border-radius: 8px; padding: 14px; }}
      table {{ width: 100%; border-collapse: collapse; margin-top: 24px; }}
      th, td {{ border: 1px solid #e2e8f0; padding: 10px; text-align: left; }}
      th {{ background: #4F8A5B; color: white; }}
      .totals {{ margin-left: auto; width: 320px; margin-top: 24px; }}
      .note {{ margin-top: 28px; font-size: 12px; color: #64748b; }}
    </style>
  </head>
  <body>
    <h1>GrowCore Payment Receipt</h1>
    <h2>Payment Receipt / Proof of Payment</h2>
    <p><strong>Receipt No:</strong> {receipt_number}</p>
    <p><strong>Order:</strong> #{order.id}</p>
    <p><strong>Payment ID:</strong> {session["id"]}</p>
    <p><strong>Payment method:</strong> Stripe</p>
    <div class="grid">
      <div class="box">
        <h3>Issuer</h3>
        <p><strong>Name:</strong> GrowCore Marketplace</p>
        <p><strong>Address:</strong> Online marketplace</p>
        <p><strong>Tax ID:</strong> Not provided</p>
      </div>
      <div class="box">
        <h3>Buyer</h3>
        <p><strong>Name:</strong> {receipt_name}</p>
        <p><strong>Email:</strong> {receipt_email}</p>
        <p><strong>NIF / Tax ID:</strong> {escape(order.customer_nif or "-")}</p>
        <p><strong>Delivery address:</strong> {delivery_address}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Product</th>
          <th>Qty</th>
          <th>Unit price</th>
          <th>Line total</th>
        </tr>
      </thead>
      <tbody>
        {"".join(rows)}
      </tbody>
    </table>
    <div class="totals">
      <p><strong>Net amount:</strong> {net_amount}</p>
      <p><strong>IVA 23% included:</strong> {iva_amount}</p>
      <p><strong>Total paid:</strong> {order.total_price}</p>
    </div>
    <p class="note">
      This document is a payment receipt/proof of payment generated from Stripe payment data.
      For Portuguese IRS or VAT reporting, retain seller tax invoices where legally required.
      GrowCore does not certify this document as a fiscal invoice unless tax/VAT data is configured.
    </p>
  </body>
</html>
"""
