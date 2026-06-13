import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  confirmStripeCheckout,
  deleteOrder,
  getOrders,
  requestOrderReturn,
} from "../api/orderApi";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHader";
import OrderCard from "../components/orders/OrderCard";
import OrdersTabs from "../components/orders/OrdersTabs";
import { useAuth } from "../hooks/useAuth";
import { formatDateTime } from "../utils/formatDateTime";
import { getApiError } from "../utils/getApiError";
import { getOrderDeliveryAddress } from "../utils/orderDeliveryAddress";
import {
  createPaymentDocument,
  downloadPaymentDocument,
} from "../utils/paymentDocument";
import { showToast } from "../utils/showToast";

export default function OrderPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("paid");

  const paidOrders = useMemo(
    () =>
      orders
        .filter((order) => order.paymentStatus === "paid")
        .sort((firstOrder, secondOrder) =>
          new Date(secondOrder.date).getTime() - new Date(firstOrder.date).getTime(),
        ),
    [orders],
  );
  const unpaidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus !== "paid"),
    [orders],
  );
  const visibleOrders = activeTab === "paid" ? paidOrders : unpaidOrders;

  useEffect(() => {
    let isActive = true;

    async function loadOrders() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const params = new URLSearchParams(location.search);
        const sessionId = params.get("session_id");

        if (params.get("stripe") === "success" && sessionId) {
          await confirmStripeCheckout(sessionId);
          showToast("Payment confirmed", "success");
        }

        const loadedOrders = await getOrders();

        if (isActive) {
          setOrders(loadedOrders);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getApiError(error, "Could not load orders"));
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
  }, [location.search]);

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
    const receiptInput = {
      paymentId,
      orderId: order.id,
      user,
      items: order.items,
      total: order.total,
      companyFeeTotal: order.companyFeeTotal,
      method: order.paymentMethod || "Stripe",
      paidAt: formatDateTime(order.date),
      deliveryAddress: getOrderDeliveryAddress(order),
      customerNif: order.customerNif,
    };
    const documentHtml = createPaymentDocument(receiptInput);

    downloadPaymentDocument(
      documentHtml,
      `growcore-payment-${paymentId}.pdf`,
      receiptInput,
    );
  }

  async function handleDeleteOrder(order) {
    const confirmed = window.confirm(`Delete unpaid order #${order.id}?`);

    if (!confirmed) return;

    setErrorMessage("");

    try {
      await deleteOrder(order.id);
      setOrders((currentOrders) =>
        currentOrders.filter((item) => item.id !== order.id),
      );
      showToast("Order deleted", "success");
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not delete order"));
    }
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

        {!isLoading && orders.length > 0 && (
          <OrdersTabs
            activeTab={activeTab}
            paidCount={paidOrders.length}
            unpaidCount={unpaidOrders.length}
            onChange={setActiveTab}
          />
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
        ) : !visibleOrders.length ? (
          <EmptyState
            title={activeTab === "paid" ? "No paid orders" : "No unpaid orders"}
            text={
              activeTab === "paid"
                ? "Completed payments will appear here."
                : "Pending payment orders will appear here."
            }
          />
        ) : (
          <div className="grid gap-5">
            {visibleOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onDelete={handleDeleteOrder}
                onDownloadReceipt={handleReceiptDownload}
                onReturnRequest={handleReturnRequest}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
