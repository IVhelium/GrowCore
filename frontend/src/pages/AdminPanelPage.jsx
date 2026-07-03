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
  CreditCard,
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
  getSellerRequests,
  rejectSellerRequest,
} from "../api/sellerRequestApi";
import { blockUser, getUsers, unblockUser } from "../api/userApi";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../api/categoriesApi";
import { getAdminTransactions } from "../api/orderApi";
import {
  getAdminStoreFilterOptions,
  updateAdminStoreFilterOption,
} from "../api/storeApi";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import PaginationBar from "../components/common/PaginationBar";
import UserMiniCard from "../components/user/UserMiniCard";
import { formatPrice } from "../utils/formatPrice";
import { getApiError } from "../utils/getApiError";
import { showToast } from "../utils/showToast";
import CategorySecretDialog from "../components/admin/CategorySecretDialog";
import { useActionDialog } from "../hooks/useActionDialog";
import AdminReviewModal from "./admin/AdminReviewModal";
import {
  ADMIN_PAGE_SIZE,
  ADMIN_USERS_PAGE_SIZE,
  sellerRequestStatusOptions,
} from "./admin/adminConstants";
import { sortAdminItems } from "./admin/adminUtils";
import {
  AdminTabs,
  AttributeChips,
  MetricCard,
  StatusBadge,
} from "./admin/AdminShared";
import AdminToolbar from "./admin/AdminToolbar";
import {
  CategoriesSection,
  FilterSellersSection,
  SellersSection,
  TransactionsSection,
  UsersSection,
} from "./admin/AdminSections";

export default function AdminPanelPage() {
  const { confirmAction, promptAction } = useActionDialog();
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
    if (categoriesResult.status === "fulfilled")
      setCategories(categoriesResult.value);
    if (filterStoresResult.status === "fulfilled")
      setFilterStores(filterStoresResult.value);

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

  async function getRejectReason(entityName) {
    return await promptAction({
      title: `Reject ${entityName}?`,
      description:
        "Add a short explanation that will be visible to the affected user.",
      inputLabel: "Reject reason",
      confirmLabel: "Reject",
      tone: "danger",
      minLength: 10,
      minLengthMessage: "Reject reason must be at least 10 characters.",
    });
  }

  async function getAdminReason(action, entityName) {
    return await promptAction({
      title: `Reason for ${action} ${entityName}`,
      description: "This reason is stored with the moderation action.",
      inputLabel: "Reason",
      confirmLabel: "Continue",
      tone:
        action === "deleting" || action === "blocking" ? "danger" : "prompt",
      minLength: 10,
      minLengthMessage: "Reason must be at least 10 characters.",
    });
  }

  async function handleCategorySubmit(event) {
    event.preventDefault();

    if (!categoryName.trim()) {
      showToast("Category name is required");
      return;
    }
    const payload = { name: categoryName.trim(), iconName: categoryIconName };
    requestCategorySecret(
      "Enter the secret to create this category.",
      async (secret) => {
        await runAction(
          "category-create",
          () => createCategory(payload, secret),
          "Category created",
        );
        setCategoryName("");
        setCategoryIconName("SlidersHorizontal");
      },
    );
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
    requestCategorySecret(
      `Enter the secret to save “${category.name}”.`,
      async (secret) => {
        await runAction(
          `category-update-${category.id}`,
          () =>
            updateCategory(
              category.id,
              {
                name: category.name,
                iconName: category.iconName,
                sortOrder: category.sortOrder,
              },
              secret,
            ),
          "Category updated",
        );
        setEditingCategoryId(null);
      },
    );
  }

  async function removeCategory(category) {
    const confirmed = await confirmAction({
      title: `Delete category "${category.name}"?`,
      description: "Products will keep working without a category.",
      confirmLabel: "Delete",
      tone: "danger",
    });

    if (!confirmed) return;

    requestCategorySecret(
      `Enter the secret to delete “${category.name}”.`,
      (secret) =>
        runAction(
          `category-delete-${category.id}`,
          () => deleteCategory(category.id, secret),
          "Category deleted",
        ),
    );
  }

  async function moveCategory(category, direction) {
    const index = categories.findIndex((item) => item.id === category.id);
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const normalized = categories.map((item, itemIndex) => ({
      ...item,
      sortOrder: (itemIndex + 1) * 10,
    }));
    const current = normalized[index];
    const target = normalized[targetIndex];
    requestCategorySecret(
      `Enter the secret to move “${category.name}”.`,
      (secret) =>
        runAction(
          `category-move-${category.id}`,
          () =>
            Promise.all([
              updateCategory(
                current.id,
                { ...current, sortOrder: target.sortOrder },
                secret,
              ),
              updateCategory(
                target.id,
                { ...target, sortOrder: current.sortOrder },
                secret,
              ),
            ]),
          "Category position updated",
        ),
    );
  }

  async function toggleFilterStore(store) {
    const key = `filter-store-${store.id}`;
    setBusyKey(key);
    try {
      const updated = await updateAdminStoreFilterOption(
        store.id,
        !store.showInFilters,
      );
      setFilterStores((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
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

  const visibleProducts = sortAdminItems(
    products.filter((product) =>
      matchesSearch(
        [
          product.title,
          product.store?.name,
          product.category,
          product.moderationStatus,
        ],
        tabSearch.moderation,
      ),
    ),
    tabSort.moderation,
    "moderation",
  );
  const visibleAdminProducts = sortAdminItems(
    adminProducts.filter((product) =>
      matchesSearch(
        [
          product.title,
          product.store?.name,
          product.category,
          product.moderationStatus,
        ],
        tabSearch.controls,
      ),
    ),
    tabSort.controls,
    "controls",
  );
  const visibleTransactions = sortAdminItems(
    transactions.filter((transaction) =>
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
    ),
    tabSort.transactions,
    "transactions",
  );
  const visibleSellerRequests = sortAdminItems(
    sellerRequests.filter((request) =>
      matchesSearch(
        [
          request.fullName,
          request.user?.username,
          request.user?.public_id,
          request.country,
          request.status,
        ],
        tabSearch.sellerRequests,
      ),
    ),
    tabSort.sellerRequests,
    "sellerRequests",
  );
  const visibleAdminUsers = sortAdminItems(
    adminUsers.filter((user) =>
      matchesSearch(
        [user.username, user.public_id, user.email],
        tabSearch.users,
      ),
    ),
    tabSort.users,
    "users",
  );
  const visibleAdminSellers = sortAdminItems(
    adminSellers.filter((user) =>
      matchesSearch(
        [user.username, user.public_id, user.email],
        tabSearch.sellers,
      ),
    ),
    tabSort.sellers,
    "sellers",
  );
  const visibleCategories = sortAdminItems(
    categories.filter((category) =>
      matchesSearch([category.name, category.iconName], tabSearch.categories),
    ),
    tabSort.categories,
    "categories",
  );
  const visibleFilterStores = sortAdminItems(
    filterStores.filter((store) =>
      matchesSearch([store.name], tabSearch.filterSellers),
    ),
    tabSort.filterSellers,
    "filterSellers",
  );

  return (
    <main>
      <Container className="py-8">
        <AdminReviewModal
          detail={reviewDetail}
          onClose={() => setReviewDetail(null)}
        />
        <CategorySecretDialog
          request={categorySecretRequest}
          onCancel={() => setCategorySecretRequest(null)}
          onConfirm={confirmCategorySecret}
        />
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

        <AdminToolbar
          activeTab={activeTab}
          tabSearch={tabSearch}
          tabSort={tabSort}
          onSearchChange={(tab, value) =>
            setTabSearch((current) => ({ ...current, [tab]: value }))
          }
          onSortChange={(tab, value) =>
            setTabSort((current) => ({ ...current, [tab]: value }))
          }
        />

        <div className="mt-6 grid gap-6">
          <div className="grid gap-6">
            <section
              className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "moderation" ? "" : "hidden"}`}
            >
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
                    <div className="flex min-w-0 flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <Link
                            to={`/product/${product.id}`}
                            className="break-anywhere font-bold text-slate-950 transition hover:text-[#4F8A5B]"
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
                          onClick={async () => {
                            const reason = await getRejectReason(product.title);
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

            <section
              className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "controls" ? "" : "hidden"}`}
            >
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
                        {(product.deletionReason ||
                          product.rejectionReason) && (
                          <p className="break-anywhere mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
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
                          onClick={async () => {
                            const reason = await getAdminReason(
                              "blocking",
                              product.title,
                            );
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
                          onClick={async () => {
                            const reason = await getAdminReason(
                              "deleting",
                              product.title,
                            );
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

            <section
              className={`rounded-xl border border-slate-200 bg-white shadow-sm ${activeTab === "sellerRequests" ? "" : "hidden"}`}
            >
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
                            onClick={async () => {
                              const reason = await getAdminReason(
                                "blocking",
                                request.user.username,
                              );
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
                            onClick={async () => {
                              const reason = await getRejectReason(
                                request.fullName,
                              );
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

            <UsersSection
              activeTab={activeTab}
              users={visibleAdminUsers}
              page={usersPage}
              total={adminUserTotal}
              busyKey={busyKey}
              runAction={runAction}
              getAdminReason={getAdminReason}
              onBlockUser={blockUser}
              onUnblockUser={unblockUser}
              onPageChange={setUsersPage}
            />

            <SellersSection
              activeTab={activeTab}
              sellers={visibleAdminSellers}
              page={sellersPage}
              total={adminSellerTotal}
              busyKey={busyKey}
              runAction={runAction}
              getAdminReason={getAdminReason}
              onBlockUser={blockUser}
              onUnblockUser={unblockUser}
              onPageChange={setSellersPage}
            />

            <TransactionsSection
              activeTab={activeTab}
              transactions={visibleTransactions}
              page={transactionsPage}
              total={transactionTotal}
              statusFilter={transactionStatusFilter}
              busyKey={busyKey}
              runAction={runAction}
              getAdminReason={getAdminReason}
              onStatusFilterChange={(value) => {
                setTransactionsPage(1);
                setTransactionStatusFilter(value);
              }}
              onPageChange={setTransactionsPage}
            />

            <CategoriesSection
              activeTab={activeTab}
              categoryName={categoryName}
              categoryIconName={categoryIconName}
              categories={categories}
              visibleCategories={visibleCategories}
              editingCategoryId={editingCategoryId}
              busyKey={busyKey}
              onCategoryNameChange={setCategoryName}
              onCategoryIconNameChange={setCategoryIconName}
              onCategoriesChange={setCategories}
              onEditingCategoryChange={setEditingCategoryId}
              onSubmit={handleCategorySubmit}
              onMove={moveCategory}
              onSave={saveCategory}
              onRemove={removeCategory}
            />

            <FilterSellersSection
              activeTab={activeTab}
              stores={visibleFilterStores}
              busyKey={busyKey}
              onToggleStore={toggleFilterStore}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}
