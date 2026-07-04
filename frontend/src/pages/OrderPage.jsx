import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowUpDown, Search } from "lucide-react";
import {
  confirmStripeCheckout,
  deleteOrder,
  getOrders,
  requestOrderReturn,
} from "../api/orderApi";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PaginationBar from "../components/common/PaginationBar";
import PageHeader from "../components/common/PageHader";
import OrderCard from "../components/orders/OrderCard";
import OrdersTabs from "../components/orders/OrdersTabs";
import { useAuth } from "../hooks/useAuth";
import { useActionDialog } from "../hooks/useActionDialog";
import { formatDateTime } from "../utils/formatDateTime";
import { getApiError } from "../utils/getApiError";
import { getOrderDeliveryAddress } from "../utils/orderDeliveryAddress";
import {
  createPaymentDocument,
  downloadPaymentDocument,
} from "../utils/paymentDocument";
import { showToast } from "../utils/showToast";

const ORDERS_PAGE_SIZE = 6;

const orderTabs = [
  {
    id: "all",
    label: "All",
    matches: () => true,
  },
  {
    id: "paid",
    label: "Paid",
    matches: (order) => order.paymentStatus === "paid",
  },
  {
    id: "pending",
    label: "Awaiting payment",
    matches: (order) => order.paymentStatus === "pending",
  },
  {
    id: "failed",
    label: "Failed",
    matches: (order) => order.paymentStatus === "failed",
  },
  {
    id: "returns",
    label: "Returns",
    matches: (order) =>
      ["requested", "approved", "rejected"].includes(order.returnStatus),
  },
  {
    id: "refunded",
    label: "Refunded",
    matches: (order) =>
      order.paymentStatus === "refunded" || order.returnStatus === "refunded",
  },
];

function getOrderSearchText(order) {
  return [
    order.id,
    order.status,
    order.paymentStatus,
    order.deliveryStatus,
    order.returnStatus,
    order.transactionId,
    order.paymentMethod,
    order.trackingNumber,
    order.returnReason,
    order.deliveryAddress,
    ...order.items.flatMap((item) => [
      item.title,
      item.productId,
      item.price,
      item.quantity,
    ]),
  ]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLowerCase();
}

function compareOrderDates(firstOrder, secondOrder) {
  return new Date(secondOrder.date).getTime() - new Date(firstOrder.date).getTime();
}

function sortOrders(orders, sortMode, recentPaidOrderId) {
  return [...orders].sort((firstOrder, secondOrder) => {
    if (sortMode === "newest" && recentPaidOrderId) {
      if (firstOrder.id === recentPaidOrderId) return -1;
      if (secondOrder.id === recentPaidOrderId) return 1;
    }

    if (sortMode === "oldest") {
      return -compareOrderDates(firstOrder, secondOrder);
    }

    if (sortMode === "total_desc") {
      return secondOrder.total - firstOrder.total || compareOrderDates(firstOrder, secondOrder);
    }

    if (sortMode === "total_asc") {
      return firstOrder.total - secondOrder.total || compareOrderDates(firstOrder, secondOrder);
    }

    if (sortMode === "status") {
      const firstStatus = `${firstOrder.paymentStatus} ${firstOrder.returnStatus}`;
      const secondStatus = `${secondOrder.paymentStatus} ${secondOrder.returnStatus}`;

      return firstStatus.localeCompare(secondStatus) || compareOrderDates(firstOrder, secondOrder);
    }

    return compareOrderDates(firstOrder, secondOrder);
  });
}

export default function OrderPage() {
  const { confirmAction, promptAction } = useActionDialog();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [recentPaidOrderId, setRecentPaidOrderId] = useState(null);

  const tabs = useMemo(
    () =>
      orderTabs.map((tab) => ({
        id: tab.id,
        label: `${tab.label} (${orders.filter(tab.matches).length})`,
      })),
    [orders],
  );

  const visibleOrders = useMemo(() => {
    const activeTabConfig =
      orderTabs.find((tab) => tab.id === activeTab) || orderTabs[0];
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filteredOrders = orders
      .filter(activeTabConfig.matches)
      .filter((order) =>
        normalizedSearch ? getOrderSearchText(order).includes(normalizedSearch) : true,
      );

    return sortOrders(filteredOrders, sortMode, recentPaidOrderId);
  }, [activeTab, orders, recentPaidOrderId, searchQuery, sortMode]);

  const activeTabLabel = useMemo(
    () => orderTabs.find((tab) => tab.id === activeTab)?.label || "orders",
    [activeTab],
  );
  const totalPages = Math.max(1, Math.ceil(visibleOrders.length / ORDERS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const firstVisibleIndex = (safeCurrentPage - 1) * ORDERS_PAGE_SIZE;
  const paginatedOrders = visibleOrders.slice(
    firstVisibleIndex,
    firstVisibleIndex + ORDERS_PAGE_SIZE,
  );

  useEffect(() => {
    let isActive = true;

    async function loadOrders() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const params = new URLSearchParams(location.search);
        const sessionId = params.get("session_id");
        let confirmedOrder = null;

        if (params.get("stripe") === "success" && sessionId) {
          try {
            confirmedOrder = await confirmStripeCheckout(sessionId);
            setRecentPaidOrderId(confirmedOrder.id);
            setActiveTab("paid");
            setSortMode("newest");
            setCurrentPage(1);
            showToast("Payment confirmed", "success");
          } catch (confirmError) {
            if (isActive) {
              setErrorMessage(
                getApiError(
                  confirmError,
                  "Payment is still being confirmed. Refresh orders in a moment.",
                ),
              );
            }
          }
        }

        const loadedOrders = await getOrders();

        if (isActive) {
          const nextOrders = confirmedOrder
            ? [
                confirmedOrder,
                ...loadedOrders.filter((order) => order.id !== confirmedOrder.id),
              ]
            : loadedOrders;

          setOrders(nextOrders);

          if (confirmedOrder) {
            navigate("/orders", { replace: true });
          }
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
  }, [location.search, navigate]);

  async function handleReturnRequest(order) {
    const trimmedReason = await promptAction({
      title: `Return order #${order.id}?`,
      description: "Tell support why this order should be returned.",
      inputLabel: "Return reason",
      confirmLabel: "Request return",
      minLength: 10,
      minLengthMessage: "Return reason must be at least 10 characters.",
    });

    if (!trimmedReason) return;

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

  function handleTabChange(tab) {
    setActiveTab(tab);
    setCurrentPage(1);
  }

  function handleSearchChange(value) {
    setSearchQuery(value);
    setCurrentPage(1);
  }

  function handleSortChange(value) {
    setSortMode(value);
    setCurrentPage(1);
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
    const confirmed = await confirmAction({
      title: `Delete unpaid order #${order.id}?`,
      description: "This unpaid order will be removed from your order history.",
      confirmLabel: "Delete",
      tone: "danger",
    });

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
          <div className="mb-6 grid gap-4">
            <OrdersTabs
              activeTab={activeTab}
              tabs={tabs}
              onChange={handleTabChange}
            />

            <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_260px]">
              <label className="relative block">
                <span className="sr-only">Search orders</span>
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Search by order, product, payment, tracking..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#4F8A5B]"
                />
              </label>

              <label className="relative block">
                <span className="sr-only">Sort orders</span>
                <ArrowUpDown
                  size={18}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={sortMode}
                  onChange={(event) => handleSortChange(event.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#4F8A5B]"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="total_desc">Total: high to low</option>
                  <option value="total_asc">Total: low to high</option>
                  <option value="status">Status</option>
                </select>
              </label>
            </div>
          </div>
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
            title={`No ${activeTabLabel.toLowerCase()} orders`}
            text={
              searchQuery.trim()
                ? "Try another search or switch to a different order tab."
                : "Orders matching this status will appear here."
            }
          />
        ) : (
          <>
            <div className="mb-4 text-sm font-semibold text-slate-500">
              Showing {firstVisibleIndex + 1}-
              {Math.min(firstVisibleIndex + paginatedOrders.length, visibleOrders.length)}{" "}
              of {visibleOrders.length} orders
            </div>

            <div className="grid gap-5">
              {paginatedOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onDelete={handleDeleteOrder}
                  onDownloadReceipt={handleReceiptDownload}
                  onReturnRequest={handleReturnRequest}
                />
              ))}
            </div>

            <PaginationBar
              current={safeCurrentPage}
              total={visibleOrders.length}
              pageSize={ORDERS_PAGE_SIZE}
              onChange={setCurrentPage}
            />
          </>
        )}
      </Container>
    </main>
  );
}
