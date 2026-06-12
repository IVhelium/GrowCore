import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock, FileText, PackageCheck, Truck } from "lucide-react";
import { getOrders, requestOrderReturn } from "../api/orderApi";
import Button from "../components/common/Button";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHader";
import { useAuth } from "../hooks/useAuth";
import { formatPrice } from "../utils/formatPrice";
import { formatDateTime } from "../utils/formatDateTime";
import { getApiError } from "../utils/getApiError";
import {
  createPaymentDocument,
  downloadPaymentDocument,
} from "../utils/paymentDocument";
import { showToast } from "../utils/showToast";

function humanizeStatus(value) {
  return value?.replaceAll("_", " ") || "-";
}

function OrderProgress({ order }) {
  const steps = [
    {
      label: "Order placed",
      active: true,
      done: true,
      icon: CheckCircle2,
    },
    {
      label: "Payment",
      value: humanizeStatus(order.paymentStatus),
      active: order.paymentStatus !== "pending",
      done: order.paymentStatus === "paid",
      icon: CheckCircle2,
    },
    {
      label: "Delivery",
      value: humanizeStatus(order.deliveryStatus),
      active: order.deliveryStatus !== "pending",
      done: order.deliveryStatus === "delivered",
      icon: Truck,
    },
    {
      label: "Return",
      value: humanizeStatus(order.returnStatus),
      active: order.returnStatus !== "none",
      done: order.returnStatus === "approved",
      icon: Clock,
    },
  ];

  return (
    <div className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-4">
      {steps.map((step) => {
        const Icon = step.icon;

        return (
          <div
            key={step.label}
            className={`rounded-lg border bg-white p-3 ${
              step.active ? "border-[#4F8A5B]/30" : "border-slate-100"
            }`}
          >
            <div
              className={`mb-2 grid h-8 w-8 place-items-center rounded-lg ${
                step.done
                  ? "bg-[#4F8A5B] text-white"
                  : step.active
                    ? "bg-[#4F8A5B]/10 text-[#4F8A5B]"
                    : "bg-slate-100 text-slate-400"
              }`}
            >
              <Icon size={16} />
            </div>
            <p className="text-xs font-bold uppercase text-slate-500">
              {step.label}
            </p>
            {step.value && (
              <p className="mt-1 text-sm font-semibold capitalize text-slate-800">
                {step.value}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function OrderPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadOrders() {
      setIsLoading(true);

      try {
        const loadedOrders = await getOrders();

        if (isActive) {
          setOrders(loadedOrders);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isActive = false;
    };
  }, []);

  async function handleReturnRequest(order) {
    const reason = window.prompt(`Reason for returning order #${order.id}`);
    const trimmedReason = reason?.trim();

    if (!trimmedReason) return;

    if (trimmedReason.length < 10) {
      showToast("Return reason must be at least 10 characters");
      return;
    }

    setErrorMessage("");

    try {
      const updatedOrder = await requestOrderReturn(order.id, trimmedReason);
      setOrders((currentOrders) =>
        currentOrders.map((item) =>
          item.id === updatedOrder.id ? updatedOrder : item,
        ),
      );
      showToast("Return requested", "success");
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not request return"));
    }
  }

  function handleReceiptDownload(order) {
    const paymentId = order.transactionId || `ORDER-${order.id}`;
    const documentHtml =
      order.paymentDocument ||
      createPaymentDocument({
        paymentId,
        user,
        items: order.items,
        total: order.total,
        method: order.paymentMethod || "Stripe",
        paidAt: formatDateTime(order.date),
        deliveryAddress: order.deliveryAddress,
        customerNif: order.customerNif,
      });

    downloadPaymentDocument(
      documentHtml,
      `growcore-payment-${paymentId}.pdf`,
    );
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Orders"
          title="Order history"
          text="Products from completed checkout stay here with quantities, prices, and status."
        />

        {errorMessage && (
          <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Loading orders...
          </div>
        ) : !orders.length ? (
          <EmptyState
            title="No orders yet"
            text="After checkout, purchased products will appear here."
          />
        ) : (
          <div className="grid gap-5">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
                      <PackageCheck size={22} />
                    </span>
                    <div>
                      <h2 className="font-bold text-slate-950">
                        Order #{order.id}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {formatDateTime(order.date)} · {humanizeStatus(order.status)}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Payment: {humanizeStatus(order.paymentStatus)} · Delivery:{" "}
                        {humanizeStatus(order.deliveryStatus)} · Return:{" "}
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
                  <div>
                    <span className="font-semibold text-slate-800">
                      Delivery address:
                    </span>{" "}
                    {order.deliveryAddress || "-"}
                  </div>
                  {order.paymentStatus === "paid" && (
                    <Button
                      type="button"
                      style="secondary"
                      className="w-fit"
                      onClick={() => handleReceiptDownload(order)}
                    >
                      <FileText size={17} />
                      Download PDF receipt
                    </Button>
                  )}
                  {order.returnReason && (
                    <div className="rounded-md bg-white p-3">
                      Return reason: {order.returnReason}
                    </div>
                  )}
                  {order.returnStatus === "none" && (
                    <button
                      type="button"
                      onClick={() => handleReturnRequest(order)}
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
                      className="flex items-center gap-4 rounded-lg border border-slate-100 p-3 transition hover:border-[#4F8A5B]"
                    >
                      <img
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
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
