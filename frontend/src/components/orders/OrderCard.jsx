import { Link } from "react-router-dom";
import { CreditCard, FileText, PackageCheck, Trash2 } from "lucide-react";
import Button from "../common/Button";
import ImageWithFallback from "../common/ImageWithFallback";
import OrderProgress from "./OrderProgress";
import { formatDateTime } from "../../utils/formatDateTime";
import { formatPrice } from "../../utils/formatPrice";
import { getOrderDeliveryAddress } from "../../utils/orderDeliveryAddress";
import { humanizeStatus } from "../../utils/orderStatus";

export default function OrderCard({
  order,
  onDelete,
  onDownloadReceipt,
  onReturnRequest,
}) {
  const hasReceipt = ["paid", "refunded"].includes(order.paymentStatus);
  const canPay = ["pending", "failed"].includes(order.paymentStatus);
  const canRequestReturn =
    order.paymentStatus === "paid" && order.returnStatus === "none";
  const deliveryAddress = getOrderDeliveryAddress(order);

  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
            <PackageCheck size={22} />
          </span>
          <div className="min-w-0">
            <h2 className="break-anywhere font-bold text-slate-950">Order #{order.id}</h2>
            <p className="break-anywhere text-sm text-slate-500">
              {formatDateTime(order.date)} - {humanizeStatus(order.status)}
            </p>
            <p className="break-anywhere mt-1 text-xs text-slate-500">
              Payment: {humanizeStatus(order.paymentStatus)} - Delivery:{" "}
              {humanizeStatus(order.deliveryStatus)} - Return:{" "}
              {humanizeStatus(order.returnStatus)}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <div className="text-xl font-black text-slate-950">
            {formatPrice(order.total)}
          </div>
          {order.trackingNumber && (
            <div className="mt-1 text-xs text-slate-500">
              Track: {order.trackingNumber}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <OrderProgress order={order} />
      </div>

      <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
        <div className="break-anywhere">
          <span className="font-semibold text-slate-800">
            Delivery address:
          </span>{" "}
          {deliveryAddress}
        </div>
        {hasReceipt ? (
          <Button
            type="button"
            style="secondary"
            className="w-fit"
            onClick={() => onDownloadReceipt(order)}
          >
            <FileText size={17} />
            Download PDF receipt
          </Button>
        ) : canPay ? (
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/payment?order=${order.id}`}
              className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-[#4F8A5B] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#3F7148]"
            >
              <CreditCard size={17} />
              Pay this order
            </Link>
            <Button
              type="button"
              style="danger"
              className="w-fit"
              onClick={() => onDelete(order)}
            >
              <Trash2 size={17} />
              Delete order
            </Button>
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-500">
            This order is not payable.
          </p>
        )}
        {order.returnReason && (
          <div className="break-anywhere whitespace-pre-wrap rounded-md bg-white p-3">
            Return reason: {order.returnReason}
          </div>
        )}
        {canRequestReturn && (
          <button
            type="button"
            onClick={() => onReturnRequest(order)}
            className="w-fit rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
          >
            Request return
          </button>
        )}
      </div>

      <div className="mt-4 grid gap-3">
        {order.items.map((item) => (
          <Link
            key={item.id}
            to={`/product/${item.productId}`}
            className="flex min-w-0 items-center gap-4 rounded-lg border border-slate-100 p-3 transition hover:border-[#4F8A5B]"
          >
            <ImageWithFallback
              src={item.image}
              alt={item.title}
              className="h-16 w-16 rounded-md object-cover"
            />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-bold text-slate-950">
                {item.title}
              </h3>
              <p className="text-sm text-slate-500">
                {item.quantity} x {formatPrice(item.price)}
              </p>
            </div>
            <div className="text-sm font-bold text-slate-950">
              {formatPrice(item.price * item.quantity)}
            </div>
          </Link>
        ))}
      </div>
    </article>
  );
}
