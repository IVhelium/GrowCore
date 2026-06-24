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
  Pencil,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createElement } from "react";
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
  getSellerRequestDocument,
  getSellerRequests,
  rejectSellerRequest,
} from "../api/sellerRequestApi";
import { blockUser, getUsers, unblockUser } from "../api/userApi";
import { createCategory, deleteCategory, getCategories, updateCategory } from "../api/categoriesApi";
import { categoryIconOptions, getCategoryIcon } from "../utils/categoryIcons";
import { getAdminTransactions } from "../api/orderApi";
import { getAdminStoreFilterOptions, updateAdminStoreFilterOption } from "../api/storeApi";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import PaginationBar from "../components/common/PaginationBar";
import UserMiniCard from "../components/user/UserMiniCard";
import UserAvatar from "../components/user/UserAvatar";
import { formatPrice } from "../utils/formatPrice";
import { getApiError } from "../utils/getApiError";
import { showToast } from "../utils/showToast";
import CategorySecretDialog from "../components/admin/CategorySecretDialog";

const adminTabs = [
  { id: "moderation", label: "Product moderation" },
  { id: "controls", label: "Product controls" },
  { id: "transactions", label: "Transactions" },
  { id: "sellerRequests", label: "Seller requests" },
  { id: "users", label: "Users" },
  { id: "sellers", label: "Sellers" },
  { id: "categories", label: "Categories" },
  { id: "filterSellers", label: "Filter sellers" },
];

const ADMIN_PAGE_SIZE = 8;
const ADMIN_USERS_PAGE_SIZE = 39;
const paymentStatusOptions = ["", "pending", "paid", "refunded", "failed"];
const sellerRequestStatusOptions = ["", "pending", "approved", "rejected"];
const adminSortOptions = {
  moderation: [["newest", "Newest first"], ["oldest", "Oldest first"], ["name-asc", "Name A–Z"], ["price-desc", "Price: high to low"], ["price-asc", "Price: low to high"]],
  controls: [["newest", "Newest first"], ["oldest", "Oldest first"], ["name-asc", "Name A–Z"], ["price-desc", "Price: high to low"], ["price-asc", "Price: low to high"]],
  transactions: [["newest", "Newest first"], ["oldest", "Oldest first"], ["total-desc", "Total: high to low"], ["total-asc", "Total: low to high"]],
  sellerRequests: [["newest", "Newest first"], ["oldest", "Oldest first"], ["name-asc", "Name A–Z"], ["status-asc", "Status A–Z"]],
  users: [["name-asc", "Name A–Z"], ["name-desc", "Name Z–A"], ["blocked-first", "Blocked first"], ["active-first", "Active first"]],
  sellers: [["name-asc", "Name A–Z"], ["name-desc", "Name Z–A"], ["blocked-first", "Blocked first"], ["active-first", "Active first"]],
  categories: [["position-asc", "Position: first to last"], ["position-desc", "Position: last to first"], ["name-asc", "Name A–Z"]],
  filterSellers: [["name-asc", "Name A–Z"], ["name-desc", "Name Z–A"], ["visible-first", "Visible first"], ["hidden-first", "Hidden first"]],
};

function compareText(first, second) {
  return String(first || "").localeCompare(String(second || ""), undefined, {
    sensitivity: "base",
  });
}

function sortAdminItems(items, sortValue, tab) {
  const sorted = [...items];
  const dateValue = (item) => new Date(
    item.createdAt || item.date || item.raw?.created_at || 0,
  ).getTime();
  const nameValue = (item) => item.title || item.fullName || item.username || item.name;

  return sorted.sort((first, second) => {
    if (sortValue === "newest") return dateValue(second) - dateValue(first) || Number(second.id || 0) - Number(first.id || 0);
    if (sortValue === "oldest") return dateValue(first) - dateValue(second) || Number(first.id || 0) - Number(second.id || 0);
    if (sortValue === "name-asc") return compareText(nameValue(first), nameValue(second));
    if (sortValue === "name-desc") return compareText(nameValue(second), nameValue(first));
    if (sortValue === "price-desc") return Number(second.price) - Number(first.price);
    if (sortValue === "price-asc") return Number(first.price) - Number(second.price);
    if (sortValue === "total-desc") return Number(second.total) - Number(first.total);
    if (sortValue === "total-asc") return Number(first.total) - Number(second.total);
    if (sortValue === "status-asc") return compareText(first.status, second.status);
    if (sortValue === "blocked-first") return Number(second.isBlocked) - Number(first.isBlocked) || compareText(nameValue(first), nameValue(second));
    if (sortValue === "active-first") return Number(first.isBlocked) - Number(second.isBlocked) || compareText(nameValue(first), nameValue(second));
    if (sortValue === "visible-first") return Number(second.showInFilters) - Number(first.showInFilters) || compareText(nameValue(first), nameValue(second));
    if (sortValue === "hidden-first") return Number(first.showInFilters) - Number(second.showInFilters) || compareText(nameValue(first), nameValue(second));
    if (sortValue === "position-desc") return Number(second.sortOrder) - Number(first.sortOrder);
    if (sortValue === "position-asc" && tab === "categories") return Number(first.sortOrder) - Number(second.sortOrder);
    return 0;
  });
}

function AdminTabs({ activeTab, onChange }) {
  return (
    <div className="mt-8 flex max-w-full snap-x overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      {adminTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`shrink-0 snap-start border-b-2 px-4 py-3 text-sm font-bold transition sm:px-5 sm:py-4 ${
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
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);

  if (!detail) return null;

  const { type, item } = detail;
  const isSellerRequest = type === "seller-request";
  const title = isSellerRequest ? "Seller request details" : "Product details";

  async function openSellerDocument() {
    const previewWindow = window.open("about:blank", "_blank");
    setIsDocumentLoading(true);

    try {
      const documentBlob = await getSellerRequestDocument(item.id);
      const documentUrl = URL.createObjectURL(documentBlob);

      if (previewWindow) {
        previewWindow.opener = null;
        previewWindow.location.replace(documentUrl);
      } else {
        const link = window.document.createElement("a");
        link.href = documentUrl;
        link.target = "_blank";
        link.rel = "noreferrer";
        link.click();
      }

      window.setTimeout(() => URL.revokeObjectURL(documentUrl), 60_000);
    } catch {
      previewWindow?.close();
    } finally {
      setIsDocumentLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
      <section className="max-h-[calc(100dvh-1rem)] w-full min-w-0 max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[90vh]">
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

        <div className="max-h-[calc(100dvh-5.6rem)] overflow-y-auto overflow-x-hidden p-4 sm:max-h-[calc(90vh-73px)] sm:p-5">
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

              <div className="grid min-w-0 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
                <FileSearch size={20} className="text-[#4F8A5B]" />
                <div className="min-w-0 flex-1">
                  <p className="break-anywhere text-sm font-bold text-slate-950">
                    {item.documentName || "Seller document"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.documentContentType || "application/pdf"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={isDocumentLoading}
                  onClick={openSellerDocument}
                  className="w-full sm:w-auto"
                >
                  <FileSearch size={16} />
                  {isDocumentLoading ? "Opening..." : "Open document"}
                </Button>
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
  const [adminSellers, setAdminSellers] = useState([]);
  const [sellerRequestTotal, setSellerRequestTotal] = useState(0);
  const [adminProductTotal, setAdminProductTotal] = useState(0);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [adminUserTotal, setAdminUserTotal] = useState(0);
  const [adminSellerTotal, setAdminSellerTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [activeTab, setActiveTab] = useState("moderation");
  const [moderationPage, setModerationPage] = useState(1);
  const [controlsPage, setControlsPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("");
  const [requestsPage, setRequestsPage] = useState(1);
  const [sellerRequestStatusFilter, setSellerRequestStatusFilter] = useState("");
  const [usersPage, setUsersPage] = useState(1);
  const [sellersPage, setSellersPage] = useState(1);
  const [categoryName, setCategoryName] = useState("");
  const [categoryIconName, setCategoryIconName] = useState("SlidersHorizontal");
  const [categorySecretRequest, setCategorySecretRequest] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filterStores, setFilterStores] = useState([]);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [tabSearch, setTabSearch] = useState({
    moderation: "",
    controls: "",
    transactions: "",
    sellerRequests: "",
    users: "",
    sellers: "",
    categories: "",
    filterSellers: "",
  });
  const [tabSort, setTabSort] = useState({
    moderation: "newest",
    controls: "newest",
    transactions: "newest",
    sellerRequests: "newest",
    users: "name-asc",
    sellers: "name-asc",
    categories: "position-asc",
    filterSellers: "name-asc",
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
      sellersResult,
      categoriesResult,
      filterStoresResult,
    ] = await Promise.allSettled([
      getPendingProducts({
        limit: ADMIN_PAGE_SIZE,
        offset: (moderationPage - 1) * ADMIN_PAGE_SIZE,
      }),
      getSellerRequests({
        status: sellerRequestStatusFilter,
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
      getUsers({
        role: "seller",
        limit: ADMIN_USERS_PAGE_SIZE,
        offset: (sellersPage - 1) * ADMIN_USERS_PAGE_SIZE,
      }),
      getCategories(),
      getAdminStoreFilterOptions(),
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
    if (sellersResult.status === "fulfilled") {
      setAdminSellers(sellersResult.value.items);
      setAdminSellerTotal(sellersResult.value.total);
    } else {
      setAdminSellers([]);
      setAdminSellerTotal(0);
    }
    if (categoriesResult.status === "fulfilled") setCategories(categoriesResult.value);
    if (filterStoresResult.status === "fulfilled") setFilterStores(filterStoresResult.value);

    const failedResults = [
      productResult,
      requestResult,
      adminProductResult,
      transactionResult,
      usersResult,
      sellersResult,
      categoriesResult,
      filterStoresResult,
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
    sellerRequestStatusFilter,
    sellersPage,
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
        text: "Applications in the selected status",
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
          adminUsers.length +
          adminSellers.length,
        icon: ShieldAlert,
        text: "Items loaded on this dashboard",
      },
    ],
    [
      productTotal,
      products.length,
      adminProducts.length,
      adminUsers.length,
      adminSellers.length,
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

    if (!categoryName.trim()) {
      showToast("Category name is required");
      return;
    }
    const payload = { name: categoryName.trim(), iconName: categoryIconName };
    requestCategorySecret("Enter the secret to create this category.", async (secret) => {
      await runAction("category-create", () => createCategory(payload, secret), "Category created");
      setCategoryName("");
      setCategoryIconName("SlidersHorizontal");
    });
  }

  function requestCategorySecret(title, action) {
    setCategorySecretRequest({ title, action });
  }

  async function confirmCategorySecret(secret) {
    const action = categorySecretRequest?.action;
    setCategorySecretRequest(null);
    if (action) await action(secret);
  }

  async function saveCategory(category) {
    requestCategorySecret(`Enter the secret to save “${category.name}”.`, async (secret) => {
      await runAction(`category-update-${category.id}`, () => updateCategory(category.id, {
        name: category.name, iconName: category.iconName, sortOrder: category.sortOrder,
      }, secret), "Category updated");
      setEditingCategoryId(null);
    });
  }

  async function removeCategory(category) {
    if (!window.confirm(`Delete category “${category.name}”? Products will keep working without a category.`)) return;
    requestCategorySecret(`Enter the secret to delete “${category.name}”.`, (secret) =>
      runAction(`category-delete-${category.id}`, () => deleteCategory(category.id, secret), "Category deleted"));
  }

  async function moveCategory(category, direction) {
    const index = categories.findIndex((item) => item.id === category.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const normalized = categories.map((item, itemIndex) => ({ ...item, sortOrder: (itemIndex + 1) * 10 }));
    const current = normalized[index];
    const target = normalized[targetIndex];
    requestCategorySecret(`Enter the secret to move “${category.name}”.`, (secret) =>
      runAction(`category-move-${category.id}`, () => Promise.all([
        updateCategory(current.id, { ...current, sortOrder: target.sortOrder }, secret),
        updateCategory(target.id, { ...target, sortOrder: current.sortOrder }, secret),
      ]), "Category position updated"));
  }

  async function toggleFilterStore(store) {
    const key = `filter-store-${store.id}`;
    setBusyKey(key);
    try {
      const updated = await updateAdminStoreFilterOption(store.id, !store.showInFilters);
      setFilterStores((items) => items.map((item) => item.id === updated.id ? updated : item));
      showToast("Seller filter updated", "success");
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not update seller filter"));
    } finally {
      setBusyKey("");
    }
  }

  function matchesSearch(values, query) {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return true;

    return values
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(cleanQuery));
  }

  const visibleProducts = sortAdminItems(products.filter((product) =>
    matchesSearch(
      [product.title, product.store?.name, product.category, product.moderationStatus],
      tabSearch.moderation,
    ),
  ), tabSort.moderation, "moderation");
  const visibleAdminProducts = sortAdminItems(adminProducts.filter((product) =>
    matchesSearch(
      [product.title, product.store?.name, product.category, product.moderationStatus],
      tabSearch.controls,
    ),
  ), tabSort.controls, "controls");
  const visibleTransactions = sortAdminItems(transactions.filter((transaction) =>
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
  ), tabSort.transactions, "transactions");
  const visibleSellerRequests = sortAdminItems(sellerRequests.filter((request) =>
    matchesSearch(
      [request.fullName, request.user?.username, request.user?.public_id, request.country, request.status],
      tabSearch.sellerRequests,
    ),
  ), tabSort.sellerRequests, "sellerRequests");
  const visibleAdminUsers = sortAdminItems(adminUsers.filter((user) =>
    matchesSearch([user.username, user.public_id, user.email], tabSearch.users),
  ), tabSort.users, "users");
  const visibleAdminSellers = sortAdminItems(adminSellers.filter((user) =>
    matchesSearch([user.username, user.public_id, user.email], tabSearch.sellers),
  ), tabSort.sellers, "sellers");
  const visibleCategories = sortAdminItems(
    categories.filter((category) => matchesSearch([category.name, category.iconName], tabSearch.categories)),
    tabSort.categories,
    "categories",
  );
  const visibleFilterStores = sortAdminItems(
    filterStores.filter((store) => matchesSearch([store.name], tabSearch.filterSellers)),
    tabSort.filterSellers,
    "filterSellers",
  );

  return (
    <main>
      <Container className="py-8">
        <ReviewModal detail={reviewDetail} onClose={() => setReviewDetail(null)} />
        <CategorySecretDialog request={categorySecretRequest} onCancel={() => setCategorySecretRequest(null)} onConfirm={confirmCategorySecret} />
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

        <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_15rem]">
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
          <label className="sr-only" htmlFor="admin-tab-sort">Sort current tab</label>
          <select
            id="admin-tab-sort"
            value={tabSort[activeTab]}
            onChange={(event) => setTabSort((current) => ({ ...current, [activeTab]: event.target.value }))}
            className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#4F8A5B]"
          >
            {(adminSortOptions[activeTab] || []).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
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
                  <article key={product.id} className="min-w-0 p-4 sm:p-5">
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

                      <div className="grid w-full shrink-0 grid-cols-1 gap-2 sm:grid-cols-3 lg:w-44 lg:grid-cols-1 xl:w-auto xl:grid-cols-3 [&>button]:w-full">
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
                  <article key={product.id} className="min-w-0 p-4 sm:p-5">
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

                      <div className="grid w-full shrink-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:w-44 lg:grid-cols-1 2xl:w-80 2xl:grid-cols-2 [&>button]:w-full">
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
              <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Seller requests
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Review current applications and their moderation history
                  </p>
                </div>
                <label className="grid gap-2 text-sm font-semibold text-slate-700">
                  Status
                  <select
                    value={sellerRequestStatusFilter}
                    onChange={(event) => {
                      setRequestsPage(1);
                      setSellerRequestStatusFilter(event.target.value);
                    }}
                    className="min-h-11 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-[#4F8A5B]"
                  >
                    {sellerRequestStatusOptions.map((status) => (
                      <option key={status || "all"} value={status}>
                        {status ? status.replace("_", " ") : "All requests"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="divide-y divide-slate-100">
                {visibleSellerRequests.length === 0 && (
                  <p className="p-5 text-sm text-slate-500">
                    No seller requests found
                  </p>
                )}

                {visibleSellerRequests.map((request) => (
                  <article key={request.id} className="min-w-0 p-4 sm:p-5">
                    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(12rem,20rem)] xl:items-start">
                      <div className="min-w-0">
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
                            className="mt-3 inline-flex max-w-full items-center rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
                          >
                            Open user profile
                          </Link>
                        )}
                        <p className="break-anywhere mt-2 text-sm text-slate-500">
                          {request.country} · {request.phoneNumber}
                        </p>
                        <p className="break-anywhere mt-3 text-sm leading-6 text-slate-600">
                          {request.message}
                        </p>
                      </div>

                      <div className="grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2 [&>button]:w-full">
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
                        {request.status === "pending" && (
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
                        )}
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
                        {request.status === "pending" && (
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
                        )}
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
                    <div className="mt-4 grid sm:block">
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

            <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "sellers" ? "" : "hidden"}`}>
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-xl font-bold text-slate-950">Sellers</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Browse seller accounts and manage their access
                </p>
              </div>

              <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleAdminSellers.length === 0 && (
                  <p className="text-sm text-slate-500">No sellers loaded.</p>
                )}

                {visibleAdminSellers.map((seller) => (
                  <article key={seller.public_id} className="rounded-xl border border-slate-200 p-4">
                    <Link
                      to={`/users/${encodeURIComponent(seller.public_id)}`}
                      className="flex min-w-0 items-center gap-3 transition hover:text-[#4F8A5B]"
                    >
                      <UserAvatar user={seller} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-950">{seller.username}</p>
                        <p className="truncate text-xs text-slate-400">{seller.public_id}</p>
                        {seller.isBlocked && (
                          <p className="mt-2 w-fit rounded-lg bg-red-50 px-2 py-1 text-xs font-bold uppercase text-red-600">blocked</p>
                        )}
                      </div>
                    </Link>
                    <div className="mt-4 grid sm:block">
                      {seller.isBlocked ? (
                        <Button
                          type="button"
                          size="sm"
                          style="secondary"
                          disabled={busyKey === `seller-${seller.public_id}`}
                          onClick={() => runAction(
                            `seller-${seller.public_id}`,
                            () => unblockUser(seller.public_id),
                            "Seller unblocked",
                          )}
                        >
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          style="danger"
                          disabled={busyKey === `seller-${seller.public_id}`}
                          onClick={() => {
                            const reason = getAdminReason("blocking", seller.username);
                            if (!reason) return;
                            runAction(
                              `seller-${seller.public_id}`,
                              () => blockUser(seller.public_id, reason),
                              "Seller blocked",
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
                  current={sellersPage}
                  total={adminSellerTotal}
                  pageSize={ADMIN_USERS_PAGE_SIZE}
                  onChange={setSellersPage}
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
                  <article key={transaction.id} className="min-w-0 p-4 sm:p-5">
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

                        <details className="group mt-4 rounded-lg border border-slate-200 bg-slate-50">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-bold text-slate-700">
                            <span>Products ({transaction.items.length})</span>
                            <ChevronDown size={17} className="transition group-open:rotate-180" />
                          </summary>
                        <div className="grid gap-2 border-t border-slate-200 p-3 sm:grid-cols-2 xl:grid-cols-3">
                          {transaction.items.map((item) => (
                            <Link
                              key={item.id}
                              to={item.productId ? `/product/${item.productId}` : "#"}
                              className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2 transition hover:border-[#4F8A5B]/40"
                            >
                              <img src={item.image} alt="" className="h-11 w-11 shrink-0 rounded-md object-cover" />
                              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-700">{item.title}</span><span className="text-xs text-slate-500">{item.quantity} × {formatPrice(item.price)}</span></span>
                            </Link>
                          ))}
                        </div>
                        </details>
                      </div>

                      <div className="grid gap-2 text-left lg:text-right">
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
                <p className="mt-1 text-sm text-slate-500">Create, order and maintain catalog categories. Editing and deletion always require the secret.</p>
              </div>

              <form
                onSubmit={handleCategorySubmit}
                className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_5rem_auto] lg:items-end"
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
                    Lucide icon
                  </span>
                  <select
                    value={categoryIconName}
                    onChange={(event) => setCategoryIconName(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                  >
                    {categoryIconOptions.map(([name]) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </label>

                <div className="grid gap-2"><span className="text-sm font-semibold text-slate-700">Preview</span><span className="grid h-11 w-11 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">{createElement(getCategoryIcon({ iconName: categoryIconName }), { size: 24 })}</span></div>

                <Button
                  type="submit"
                  disabled={busyKey === "category-create"}
                >
                  Add category
                </Button>
              </form>

              <div className="divide-y divide-slate-100 border-t border-slate-200">
                {visibleCategories.map((category) => {
                  const editing = editingCategoryId === category.id;
                  return (
                    <article key={category.id} className="grid min-w-0 gap-3 p-4 sm:p-5 md:grid-cols-[3rem_minmax(0,1fr)] md:items-center xl:grid-cols-[3rem_minmax(0,1fr)_12rem_auto]">
                      <span className="text-[#4F8A5B]">{createElement(getCategoryIcon(category), { size: 22 })}</span>
                      <input disabled={!editing} value={category.name} onChange={(event) => setCategories((items) => items.map((item) => item.id === category.id ? { ...item, name: event.target.value } : item))} className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:border-transparent disabled:bg-transparent" />
                      <select disabled={!editing} value={category.iconName} onChange={(event) => setCategories((items) => items.map((item) => item.id === category.id ? { ...item, iconName: event.target.value } : item))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:border-transparent disabled:bg-transparent md:col-start-2 xl:col-start-auto">{categoryIconOptions.map(([name]) => <option key={name}>{name}</option>)}</select>
                      <div className="flex flex-wrap items-center gap-2 md:col-span-2 xl:col-span-1 xl:justify-end">
                        <button type="button" disabled={categories[0]?.id === category.id || busyKey === `category-move-${category.id}`} onClick={() => moveCategory(category, -1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30" aria-label="Move category up"><ChevronUp size={16} /></button>
                        <button type="button" disabled={categories.at(-1)?.id === category.id || busyKey === `category-move-${category.id}`} onClick={() => moveCategory(category, 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-30" aria-label="Move category down"><ChevronDown size={16} /></button>
                        {editing ? <Button size="sm" onClick={() => saveCategory(category)}>Save</Button> : <Button size="sm" style="secondary" onClick={() => setEditingCategoryId(category.id)}><Pencil size={15} /> Edit</Button>}
                        <Button size="sm" style="danger" onClick={() => removeCategory(category)}><Trash2 size={15} /></Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "filterSellers" ? "" : "hidden"}`}>
              <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-xl font-bold text-slate-950">Seller filter options</h2><p className="mt-1 text-sm text-slate-500">Selected stores appear by name; every other store remains available through “Other”.</p></div>
              <div className="divide-y divide-slate-100">
                {visibleFilterStores.map((store) => <label key={store.id} className="flex cursor-pointer items-center justify-between gap-4 p-5"><span className="font-semibold text-slate-700">{store.name}</span><input type="checkbox" checked={store.showInFilters} disabled={busyKey === `filter-store-${store.id}`} onChange={() => toggleFilterStore(store)} className="h-5 w-5 accent-[#4F8A5B]" /></label>)}
                {!visibleFilterStores.length && <p className="p-5 text-sm text-slate-500">No stores found.</p>}
              </div>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}


