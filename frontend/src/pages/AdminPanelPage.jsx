import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Ban,
  Trash2,
  PackageCheck,
  ShieldAlert,
  Store,
  XCircle,
  Eye,
  FileSearch,
  CreditCard,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  approveProduct,
  blockProduct,
  deleteAdminProduct,
  getAdminProducts,
  getPendingProducts,
  rejectProduct,
} from "../api/productApi";
import {
  approveSellerRequest,
  getSellerRequestDocumentUrl,
  getSellerRequests,
  rejectSellerRequest,
} from "../api/sellerRequestApi";
import { blockUser, getUsers, unblockUser } from "../api/userApi";
import { createCategory } from "../api/categoriesApi";
import { getAdminTransactions } from "../api/orderApi";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import PaginationBar from "../components/common/PaginationBar";
import UserMiniCard from "../components/user/UserMiniCard";
import UserAvatar from "../components/user/UserAvatar";
import { formatPrice } from "../utils/formatPrice";
import { getApiError } from "../utils/getApiError";
import { showToast } from "../utils/showToast";

const adminTabs = [
  { id: "moderation", label: "Product moderation" },
  { id: "controls", label: "Product controls" },
  { id: "transactions", label: "Transactions" },
  { id: "sellerRequests", label: "Seller requests" },
  { id: "users", label: "Users" },
  { id: "categories", label: "Categories" },
];

const ADMIN_PAGE_SIZE = 8;
const ADMIN_USERS_PAGE_SIZE = 39;
const paymentStatusOptions = ["", "pending", "paid", "refunded", "failed"];

function AdminTabs({ activeTab, onChange }) {
  return (
    <div className="mt-8 flex overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      {adminTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`shrink-0 border-b-2 px-5 py-4 text-sm font-bold transition ${
            activeTab === tab.id
              ? "border-[#4F8A5B] text-[#4F8A5B]"
              : "border-transparent text-slate-500 hover:text-slate-950"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    open: "bg-blue-50 text-blue-700",
    in_progress: "bg-indigo-50 text-indigo-700",
    assigned: "bg-indigo-50 text-indigo-700",
    paid: "bg-green-50 text-green-700",
    approved: "bg-green-50 text-green-700",
    refunded: "bg-sky-50 text-sky-700",
    failed: "bg-red-50 text-red-700",
    rejected: "bg-red-50 text-red-700",
    blocked: "bg-orange-50 text-orange-700",
    deleted: "bg-slate-200 text-slate-700",
    preparing: "bg-amber-50 text-amber-700",
    delivered: "bg-green-50 text-green-700",
    delayed: "bg-red-50 text-red-700",
    none: "bg-slate-100 text-slate-600",
    requested: "bg-amber-50 text-amber-700",
    resolved: "bg-green-50 text-green-700",
    closed: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`rounded-lg px-3 py-1 text-xs font-bold uppercase ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status?.replace("_", " ") || "unknown"}
    </span>
  );
}

function MetricCard({ item }) {
  const Icon = item.icon;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{item.title}</p>
          <div className="mt-2 text-3xl font-black text-slate-950">
            {item.value}
          </div>
          <p className="mt-2 text-sm text-slate-500">{item.text}</p>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
          <Icon size={24} />
        </div>
      </div>
    </article>
  );
}

function AttributeChips({ attributes = {} }) {
  const entries = Object.entries(attributes).filter(([, value]) => value);

  if (!entries.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {entries.map(([name, value]) => (
        <span
          key={name}
          className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
        >
          {name}: {value}
        </span>
      ))}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
      <p className="break-anywhere mt-1 text-sm leading-6 text-slate-700">
        {value || "-"}
      </p>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function ReviewModal({ detail, onClose }) {
  if (!detail) return null;

  const { type, item } = detail;
  const isSellerRequest = type === "seller-request";
  const title = isSellerRequest ? "Seller request details" : "Product details";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <section className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-[#4F8A5B]">
              Admin review
            </p>
            <h2 className="break-anywhere text-xl font-bold text-slate-950">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
            aria-label="Close details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-73px)] overflow-y-auto p-5">
          {isSellerRequest ? (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-anywhere text-2xl font-bold text-slate-950">
                    {item.fullName}
                  </h3>
                  <p className="break-anywhere mt-1 text-sm text-slate-500">
                    Request #{item.id}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-2">
                <DetailRow label="User" value={item.user?.username} />
                <DetailRow label="Public ID" value={item.user?.public_id} />
                <DetailRow label="Passport ID" value={item.passportId} />
                <DetailRow label="Phone" value={item.phoneNumber} />
                <DetailRow label="Country" value={item.country} />
                <DetailRow label="Created" value={item.createdAt} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Seller message
                </p>
                <p className="break-anywhere mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                  {item.message}
                </p>
              </div>

              {item.rejectionReason && (
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Rejection reason
                  </p>
                  <p className="break-anywhere mt-2 rounded-lg bg-red-50 p-4 text-sm leading-6 text-red-700">
                    {item.rejectionReason}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 p-4">
                <FileSearch size={20} className="text-[#4F8A5B]" />
                <div className="min-w-0 flex-1">
                  <p className="break-anywhere text-sm font-bold text-slate-950">
                    {item.documentName || "Seller document"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.documentContentType || "application/pdf"}
                  </p>
                </div>
                <a
                  href={getSellerRequestDocumentUrl(item.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#4F8A5B] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#3F7148]"
                >
                  <FileSearch size={16} />
                  Open PDF
                </a>
              </div>
            </div>
          ) : (
            <div className="grid gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-anywhere text-2xl font-bold text-slate-950">
                    {item.title}
                  </h3>
                  <p className="break-anywhere mt-1 text-sm text-slate-500">
                    Product #{item.id} · {item.store?.name || "Unknown store"}
                  </p>
                </div>
                <StatusBadge status={item.moderationStatus} />
              </div>

              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="max-h-80 w-full rounded-lg object-cover"
                />
              )}

              <div className="grid gap-4 rounded-lg bg-slate-50 p-4 md:grid-cols-3">
                <DetailRow label="Category" value={item.category} />
                <DetailRow label="Price" value={formatPrice(item.price)} />
                <DetailRow
                  label="Discount ends"
                  value={item.discountExpiresAt ? formatDateTime(item.discountExpiresAt) : "No expiry"}
                />
                <DetailRow label="Quantity" value={item.quantity} />
                <DetailRow label="Enabled" value={item.enabled ? "Yes" : "No"} />
                <DetailRow label="Store" value={item.store?.name} />
                <DetailRow label="Created" value={item.raw?.created_at} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-400">
                  Description
                </p>
                <p className="break-anywhere mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                  {item.description}
                </p>
              </div>

              <AttributeChips attributes={item.attributes} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function AdminPanelPage() {
  const [products, setProducts] = useState([]);
  const [productTotal, setProductTotal] = useState(0);
  const [sellerRequests, setSellerRequests] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [sellerRequestTotal, setSellerRequestTotal] = useState(0);
  const [adminProductTotal, setAdminProductTotal] = useState(0);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [adminUserTotal, setAdminUserTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [activeTab, setActiveTab] = useState("moderation");
  const [moderationPage, setModerationPage] = useState(1);
  const [controlsPage, setControlsPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("");
  const [requestsPage, setRequestsPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [categoryName, setCategoryName] = useState("");
  const [categoryImageUrl, setCategoryImageUrl] = useState("");
  const [tabSearch, setTabSearch] = useState({
    moderation: "",
    controls: "",
    transactions: "",
    sellerRequests: "",
    users: "",
    categories: "",
  });
  const [reviewDetail, setReviewDetail] = useState(null);

  async function loadAdminData() {
    setIsLoading(true);
    setErrorMessage("");

    const [
      productResult,
      requestResult,
      adminProductResult,
      transactionResult,
      usersResult,
    ] = await Promise.allSettled([
      getPendingProducts({
        limit: ADMIN_PAGE_SIZE,
        offset: (moderationPage - 1) * ADMIN_PAGE_SIZE,
      }),
      getSellerRequests({
        status: "pending",
        limit: ADMIN_PAGE_SIZE,
        offset: (requestsPage - 1) * ADMIN_PAGE_SIZE,
      }),
      getAdminProducts({
        limit: ADMIN_PAGE_SIZE,
        offset: (controlsPage - 1) * ADMIN_PAGE_SIZE,
      }),
      getAdminTransactions({
        limit: ADMIN_PAGE_SIZE,
        offset: (transactionsPage - 1) * ADMIN_PAGE_SIZE,
        paymentStatus: transactionStatusFilter,
      }),
      getUsers({
        limit: ADMIN_USERS_PAGE_SIZE,
        offset: (usersPage - 1) * ADMIN_USERS_PAGE_SIZE,
      }),
    ]);

    if (productResult.status === "fulfilled") {
      const productPage = productResult.value;
      setProducts(productPage.items);
      setProductTotal(productPage.total);
    } else {
      setProducts([]);
      setProductTotal(0);
    }

    if (requestResult.status === "fulfilled") {
      const requestPage = requestResult.value;
      setSellerRequests(requestPage.items);
      setSellerRequestTotal(requestPage.total);
    } else {
      setSellerRequests([]);
      setSellerRequestTotal(0);
    }

    if (adminProductResult.status === "fulfilled") {
      setAdminProducts(adminProductResult.value.items);
      setAdminProductTotal(adminProductResult.value.total);
    } else {
      setAdminProducts([]);
      setAdminProductTotal(0);
    }

    if (transactionResult.status === "fulfilled") {
      setTransactions(transactionResult.value.items);
      setTransactionTotal(transactionResult.value.total);
    } else {
      setTransactions([]);
      setTransactionTotal(0);
    }

    if (usersResult.status === "fulfilled") {
      setAdminUsers(usersResult.value.items);
      setAdminUserTotal(usersResult.value.total);
    } else {
      setAdminUsers([]);
      setAdminUserTotal(0);
    }

    const failedResults = [
      productResult,
      requestResult,
      adminProductResult,
      transactionResult,
      usersResult,
    ].filter((result) => result.status === "rejected");

    if (failedResults.length > 0) {
      setErrorMessage(
        getApiError(
          failedResults[0].reason,
          "Some admin queues could not be loaded",
        ),
      );
    }

    setIsLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAdminData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    controlsPage,
    moderationPage,
    requestsPage,
    transactionStatusFilter,
    transactionsPage,
    usersPage,
  ]);

  const metrics = useMemo(
    () => [
      {
        title: "Pending products",
        value: productTotal,
        icon: PackageCheck,
        text: "Products waiting for moderation",
      },
      {
        title: "Seller requests",
        value: sellerRequestTotal,
        icon: Store,
        text: "New seller applications",
      },
      {
        title: "Transactions",
        value: transactionTotal,
        icon: CreditCard,
        text: "Orders across payment statuses",
      },
      {
        title: "Visible queues",
        value:
          products.length +
          sellerRequests.length +
          adminProducts.length +
          transactions.length +
          adminUsers.length,
        icon: ShieldAlert,
        text: "Items loaded on this dashboard",
      },
    ],
    [
      productTotal,
      products.length,
      adminProducts.length,
      adminUsers.length,
      transactionTotal,
      transactions.length,
      sellerRequestTotal,
      sellerRequests.length,
    ],
  );

  async function runAction(key, action, successMessage) {
    setBusyKey(key);
    setErrorMessage("");

    try {
      await action();
      showToast(successMessage, "success");
      await loadAdminData();
    } catch (error) {
      setErrorMessage(getApiError(error, "Admin action failed"));
    } finally {
      setBusyKey("");
    }
  }

  function getRejectReason(entityName) {
    const reason = window.prompt(`Reason for rejecting ${entityName}`);
    const trimmedReason = reason?.trim();

    if (trimmedReason && trimmedReason.length < 10) {
      showToast("Reject reason must be at least 10 characters");
      return "";
    }

    return trimmedReason;
  }

  function getAdminReason(action, entityName) {
    const reason = window.prompt(`Reason for ${action} ${entityName}`);
    const trimmedReason = reason?.trim();

    if (trimmedReason && trimmedReason.length < 10) {
      showToast("Reason must be at least 10 characters");
      return "";
    }

    return trimmedReason;
  }

  async function handleCategorySubmit(event) {
    event.preventDefault();

    if (!categoryName.trim() || !categoryImageUrl.trim()) {
      showToast("Category name and image URL are required");
      return;
    }

    await runAction(
      "category-create",
      () =>
        createCategory({
          name: categoryName.trim(),
          imageUrl: categoryImageUrl.trim(),
        }),
      "Category created",
    );
    setCategoryName("");
    setCategoryImageUrl("");
  }

  function matchesSearch(values, query) {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return true;

    return values
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(cleanQuery));
  }

  const visibleProducts = products.filter((product) =>
    matchesSearch(
      [product.title, product.store?.name, product.category, product.moderationStatus],
      tabSearch.moderation,
    ),
  );
  const visibleAdminProducts = adminProducts.filter((product) =>
    matchesSearch(
      [product.title, product.store?.name, product.category, product.moderationStatus],
      tabSearch.controls,
    ),
  );
  const visibleTransactions = transactions.filter((transaction) =>
    matchesSearch(
      [
        transaction.id,
        transaction.paymentStatus,
        transaction.deliveryStatus,
        transaction.returnStatus,
        transaction.transactionId,
        transaction.paymentMethod,
        transaction.customerNif,
        transaction.userId,
      ],
      tabSearch.transactions,
    ),
  );
  const visibleSellerRequests = sellerRequests.filter((request) =>
    matchesSearch(
      [request.fullName, request.user?.username, request.user?.public_id, request.country, request.status],
      tabSearch.sellerRequests,
    ),
  );
  const visibleAdminUsers = adminUsers.filter((user) =>
    matchesSearch([user.username, user.public_id, user.email], tabSearch.users),
  );

  return (
    <main>
      <Container className="py-8">
        <ReviewModal detail={reviewDetail} onClose={() => setReviewDetail(null)} />
        <PageHeader
          pretitle="Admin"
          title="Admin panel"
          text="Moderate seller requests, products and support tickets from one dashboard"
        />

        {errorMessage && (
          <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        {isLoading && (
          <p className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
            Loading admin queues...
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((item) => (
            <MetricCard key={item.title} item={item} />
          ))}
        </section>

        <AdminTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-4">
          <input
            value={tabSearch[activeTab] || ""}
            onChange={(event) =>
              setTabSearch((current) => ({
                ...current,
                [activeTab]: event.target.value,
              }))
            }
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
            placeholder={`Search ${adminTabs.find((tab) => tab.id === activeTab)?.label || "admin tab"}...`}
          />
        </div>

        <div className="mt-6 grid gap-6">
          <div className="grid gap-6">
            <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "moderation" ? "" : "hidden"}`}>
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Product moderation
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review products before they appear in the catalog
                  </p>
                </div>
                <Clock className="text-slate-400" size={22} />
              </div>

              <div className="divide-y divide-slate-100">
                {visibleProducts.length === 0 && (
                  <p className="p-5 text-sm text-slate-500">
                    No products waiting for moderation.
                  </p>
                )}

                {visibleProducts.map((product) => (
                  <article key={product.id} className="p-5">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            to={`/product/${product.id}`}
                            className="font-bold text-slate-950 transition hover:text-[#4F8A5B]"
                          >
                            {product.title}
                          </Link>
                          <StatusBadge status={product.moderationStatus} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Seller: {product.store?.name || "Unknown"} · Price:{" "}
                          {formatPrice(product.price)}
                        </p>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                          {product.description}
                        </p>
                        <AttributeChips attributes={product.attributes} />
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          size="sm"
                          style="ghost"
                          onClick={() =>
                            setReviewDetail({ type: "product", item: product })
                          }
                        >
                          <Eye size={16} />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          disabled={busyKey === `product-${product.id}`}
                          onClick={() =>
                            runAction(
                              `product-${product.id}`,
                              () => approveProduct(product.id),
                              "Product approved",
                            )
                          }
                        >
                          <CheckCircle2 size={16} />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          style="danger"
                          disabled={busyKey === `product-${product.id}`}
                          onClick={() => {
                            const reason = getRejectReason(product.title);
                            if (!reason) return;

                            runAction(
                              `product-${product.id}`,
                              () => rejectProduct(product.id, reason),
                              "Product rejected",
                            );
                          }}
                        >
                          <XCircle size={16} />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="px-5 pb-5">
                <PaginationBar
                  current={moderationPage}
                  total={productTotal}
                  pageSize={ADMIN_PAGE_SIZE}
                  onChange={setModerationPage}
                />
              </div>
            </section>

            <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "controls" ? "" : "hidden"}`}>
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-xl font-bold text-slate-950">
                  Product controls
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Block or safely delete products with a recorded reason
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {visibleAdminProducts.length === 0 && (
                  <p className="p-5 text-sm text-slate-500">
                    No products loaded.
                  </p>
                )}

                {visibleAdminProducts.map((product) => (
                  <article key={product.id} className="p-5">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            to={`/product/${product.id}`}
                            className="font-bold text-slate-950 transition hover:text-[#4F8A5B]"
                          >
                            {product.title}
                          </Link>
                          <StatusBadge status={product.moderationStatus} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {product.store?.name || "Unknown"} ·{" "}
                          {formatPrice(product.price)} ·{" "}
                          {product.enabled ? "enabled" : "disabled"}
                        </p>
                        {(product.deletionReason || product.rejectionReason) && (
                          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                            {product.deletionReason || product.rejectionReason}
                          </p>
                        )}
                        <AttributeChips attributes={product.attributes} />
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          size="sm"
                          style="ghost"
                          onClick={() =>
                            setReviewDetail({ type: "product", item: product })
                          }
                        >
                          <Eye size={16} />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          style="secondary"
                          disabled={busyKey === `admin-product-${product.id}`}
                          onClick={() => {
                            const reason = getAdminReason("blocking", product.title);
                            if (!reason) return;

                            runAction(
                              `admin-product-${product.id}`,
                              () => blockProduct(product.id, reason),
                              "Product blocked",
                            );
                          }}
                        >
                          <Ban size={16} />
                          Block
                        </Button>
                        <Button
                          size="sm"
                          style="danger"
                          disabled={busyKey === `admin-product-${product.id}`}
                          onClick={() => {
                            const reason = getAdminReason("deleting", product.title);
                            if (!reason) return;

                            runAction(
                              `admin-product-${product.id}`,
                              () => deleteAdminProduct(product.id, reason),
                              "Product deleted",
                            );
                          }}
                        >
                          <Trash2 size={16} />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="px-5 pb-5">
                <PaginationBar
                  current={controlsPage}
                  total={adminProductTotal}
                  pageSize={ADMIN_PAGE_SIZE}
                  onChange={setControlsPage}
                />
              </div>
            </section>

            <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "sellerRequests" ? "" : "hidden"}`}>
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-xl font-bold text-slate-950">
                  Seller requests
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Approve or reject seller applications
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {visibleSellerRequests.length === 0 && (
                  <p className="p-5 text-sm text-slate-500">
                    No seller requests waiting for review
                  </p>
                )}

                {visibleSellerRequests.map((request) => (
                  <article key={request.id} className="p-5">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-bold text-slate-950">
                            {request.fullName}
                          </h3>
                          <StatusBadge status={request.status} />
                        </div>
                        <div className="mt-2">
                          <UserMiniCard user={request.user} />
                        </div>
                        {request.user?.public_id && (
                          <Link
                            to={`/users/${encodeURIComponent(request.user.public_id)}`}
                            className="mt-3 inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
                          >
                            Open user profile
                          </Link>
                        )}
                        <p className="mt-2 text-sm text-slate-500">
                          {request.country} · {request.phoneNumber}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {request.message}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          size="sm"
                          style="ghost"
                          onClick={() =>
                            setReviewDetail({
                              type: "seller-request",
                              item: request,
                            })
                          }
                        >
                          <Eye size={16} />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          disabled={busyKey === `request-${request.id}`}
                          onClick={() =>
                            runAction(
                              `request-${request.id}`,
                              () => approveSellerRequest(request.id),
                              "Seller request approved",
                            )
                          }
                        >
                          Approve
                        </Button>
                        {request.user?.public_id && (
                          <Button
                            size="sm"
                            style="secondary"
                            disabled={busyKey === `request-user-${request.id}`}
                            onClick={() => {
                              const reason = getAdminReason("blocking", request.user.username);
                              if (!reason) return;

                              runAction(
                                `request-user-${request.id}`,
                                () => blockUser(request.user.public_id, reason),
                                "User blocked",
                              );
                            }}
                          >
                            <Ban size={16} />
                            Block user
                          </Button>
                        )}
                        <Button
                          size="sm"
                          style="danger"
                          disabled={busyKey === `request-${request.id}`}
                          onClick={() => {
                            const reason = getRejectReason(request.fullName);
                            if (!reason) return;

                            runAction(
                              `request-${request.id}`,
                              () => rejectSellerRequest(request.id, reason),
                              "Seller request rejected",
                            );
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="px-5 pb-5">
                <PaginationBar
                  current={requestsPage}
                  total={sellerRequestTotal}
                  pageSize={ADMIN_PAGE_SIZE}
                  onChange={setRequestsPage}
                />
              </div>
            </section>

            <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "users" ? "" : "hidden"}`}>
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-xl font-bold text-slate-950">
                  Users
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Open user profiles and use admin actions from the profile page
                </p>
              </div>

              <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleAdminUsers.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No users loaded.
                  </p>
                )}

                {visibleAdminUsers.map((user) => (
                  <article
                    key={user.public_id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <Link
                      to={`/users/${encodeURIComponent(user.public_id)}`}
                      className="flex items-center gap-3 transition hover:text-[#4F8A5B]"
                    >
                      <UserAvatar user={user} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">
                          {user.username}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {user.public_id}
                        </p>
                        {user.isBlocked && (
                          <p className="mt-2 w-fit rounded-lg bg-red-50 px-2 py-1 text-xs font-bold uppercase text-red-600">
                            blocked
                          </p>
                        )}
                      </div>
                    </Link>
                    <div className="mt-4">
                      {user.isBlocked ? (
                        <Button
                          type="button"
                          size="sm"
                          style="secondary"
                          disabled={busyKey === `user-${user.public_id}`}
                          onClick={() =>
                            runAction(
                              `user-${user.public_id}`,
                              () => unblockUser(user.public_id),
                              "User unblocked",
                            )
                          }
                        >
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          style="danger"
                          disabled={busyKey === `user-${user.public_id}`}
                          onClick={() => {
                            const reason = getAdminReason("blocking", user.username);
                            if (!reason) return;

                            runAction(
                              `user-${user.public_id}`,
                              () => blockUser(user.public_id, reason),
                              "User blocked",
                            );
                          }}
                        >
                          Block
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              <div className="px-5 pb-5">
                <PaginationBar
                  current={usersPage}
                  total={adminUserTotal}
                  pageSize={ADMIN_USERS_PAGE_SIZE}
                  onChange={setUsersPage}
                />
              </div>
            </section>

            <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "transactions" ? "" : "hidden"}`}>
              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Transactions
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    All orders by payment, delivery and return status
                  </p>
                </div>

                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Payment status
                  <select
                    value={transactionStatusFilter}
                    onChange={(event) => {
                      setTransactionsPage(1);
                      setTransactionStatusFilter(event.target.value);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-[#4F8A5B]"
                  >
                    {paymentStatusOptions.map((status) => (
                      <option key={status || "all"} value={status}>
                        {status ? status.replace("_", " ") : "All statuses"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="divide-y divide-slate-100">
                {visibleTransactions.length === 0 && (
                  <p className="p-5 text-sm text-slate-500">
                    No transactions loaded.
                  </p>
                )}

                {visibleTransactions.map((transaction) => (
                  <article key={transaction.id} className="p-5">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-bold text-slate-950">
                            Order #{transaction.id}
                          </h3>
                          <StatusBadge status={transaction.paymentStatus} />
                          <StatusBadge status={transaction.deliveryStatus} />
                          <StatusBadge status={transaction.returnStatus} />
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {formatPrice(transaction.total)} · {formatDateTime(transaction.date)}
                        </p>
                        <p className="break-anywhere mt-2 text-sm text-slate-600">
                          User: {transaction.userId || "-"} · Method:{" "}
                          {transaction.paymentMethod || "-"} · Transaction:{" "}
                          {transaction.transactionId || "-"}
                        </p>
                        <p className="break-anywhere mt-2 text-sm text-slate-600">
                          NIF: {transaction.customerNif || "-"} · Tracking:{" "}
                          {transaction.trackingNumber || "-"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {transaction.items.map((item) => (
                            <span
                              key={item.id}
                              className="rounded-lg bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600"
                            >
                              {item.title} x {item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-2 text-right">
                        <p className="text-xs font-bold uppercase text-slate-400">
                          Platform fee
                        </p>
                        <p className="font-bold text-slate-950">
                          {formatPrice(transaction.companyFeeTotal)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="px-5 pb-5">
                <PaginationBar
                  current={transactionsPage}
                  total={transactionTotal}
                  pageSize={ADMIN_PAGE_SIZE}
                  onChange={setTransactionsPage}
                />
              </div>
            </section>

            <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "categories" ? "" : "hidden"}`}>
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-xl font-bold text-slate-950">
                  Categories
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add catalog categories for seller products
                </p>
              </div>

              <form
                onSubmit={handleCategorySubmit}
                className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end"
              >
                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Category name
                  </span>
                  <input
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                    placeholder="Hydroponics"
                    required
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-semibold text-slate-700">
                    Image URL
                  </span>
                  <input
                    value={categoryImageUrl}
                    onChange={(event) => setCategoryImageUrl(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                    placeholder="/media/category/example.jpg"
                    required
                  />
                </label>

                <Button
                  type="submit"
                  disabled={busyKey === "category-create"}
                >
                  Add category
                </Button>
              </form>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}


