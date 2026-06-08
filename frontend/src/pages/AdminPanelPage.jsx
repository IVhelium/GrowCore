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
} from "lucide-react";
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
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import Button from "../components/common/Button";
import { formatPrice } from "../utils/formatPrice";
import { getApiError } from "../utils/getApiError";
import { showToast } from "../utils/showToast";

function StatusBadge({ status }) {
  const styles = {
    pending: "bg-amber-50 text-amber-700",
    open: "bg-blue-50 text-blue-700",
    in_progress: "bg-indigo-50 text-indigo-700",
    assigned: "bg-indigo-50 text-indigo-700",
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    blocked: "bg-orange-50 text-orange-700",
    deleted: "bg-slate-200 text-slate-700",
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

export default function AdminPanelPage() {
  const [products, setProducts] = useState([]);
  const [productTotal, setProductTotal] = useState(0);
  const [sellerRequests, setSellerRequests] = useState([]);
  const [adminProducts, setAdminProducts] = useState([]);
  const [sellerRequestTotal, setSellerRequestTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [busyKey, setBusyKey] = useState("");

  async function loadAdminData() {
    setIsLoading(true);
    setErrorMessage("");

    const [productResult, requestResult, adminProductResult] = await Promise.allSettled([
      getPendingProducts(),
      getSellerRequests({ status: "pending" }),
      getAdminProducts({ limit: 10 }),
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
    } else {
      setAdminProducts([]);
    }

    const failedResults = [
      productResult,
      requestResult,
      adminProductResult,
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
  }, []);

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
        title: "Admin queues",
        value: productTotal + sellerRequestTotal,
        icon: ShieldAlert,
        text: "Items awaiting administrator review",
      },
      {
        title: "Visible queues",
        value: products.length + sellerRequests.length + adminProducts.length,
        icon: ShieldAlert,
        text: "Items loaded on this dashboard",
      },
    ],
    [
      productTotal,
      products.length,
      adminProducts.length,
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

  return (
    <main>
      <Container className="py-8">
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

        <div className="mt-8 grid gap-6">
          <div className="grid gap-6">
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
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
                {products.length === 0 && (
                  <p className="p-5 text-sm text-slate-500">
                    No products waiting for moderation.
                  </p>
                )}

                {products.map((product) => (
                  <article key={product.id} className="p-5">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-bold text-slate-950">
                            {product.title}
                          </h3>
                          <StatusBadge status={product.moderationStatus} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Seller: {product.store?.name || "Unknown"} · Price:{" "}
                          {formatPrice(product.price)}
                        </p>
                        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                          {product.description}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
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
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-xl font-bold text-slate-950">
                  Product controls
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Block or safely delete products with a recorded reason
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {adminProducts.length === 0 && (
                  <p className="p-5 text-sm text-slate-500">
                    No products loaded.
                  </p>
                )}

                {adminProducts.map((product) => (
                  <article key={product.id} className="p-5">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-bold text-slate-950">
                            {product.title}
                          </h3>
                          <StatusBadge status={product.moderationStatus} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {product.store?.name || "Unknown"} В·{" "}
                          {formatPrice(product.price)} В·{" "}
                          {product.enabled ? "enabled" : "disabled"}
                        </p>
                        {(product.deletionReason || product.rejectionReason) && (
                          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                            {product.deletionReason || product.rejectionReason}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
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
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-xl font-bold text-slate-950">
                  Seller requests
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Approve or reject seller applications
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {sellerRequests.length === 0 && (
                  <p className="p-5 text-sm text-slate-500">
                    No seller requests waiting for review
                  </p>
                )}

                {sellerRequests.map((request) => (
                  <article key={request.id} className="p-5">
                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-bold text-slate-950">
                            {request.fullName}
                          </h3>
                          <StatusBadge status={request.status} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {request.country} · {request.phoneNumber}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {request.message}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
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
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
