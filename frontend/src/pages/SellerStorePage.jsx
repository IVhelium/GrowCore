import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Edit, Plus, Save, Store, Trash2 } from "lucide-react";
import { deleteSellerProduct, getMySellerProducts } from "../api/productApi";
import { getMyStore, updateMyStore } from "../api/storeApi";
import Button from "../components/common/Button";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import FormField from "../components/common/FormField";
import PageHeader from "../components/common/PageHader";
import { formatPrice } from "../utils/formatPrice";
import { getApiError } from "../utils/getApiError";
import {
  getEmptyFieldMessage,
  getTrimmedFormData,
  hasEmptyRequiredFields,
} from "../utils/formSpaceValidation";
import { showToast } from "../utils/showToast";

function StatusBadge({ status }) {
  const styles = {
    draft: "bg-slate-100 text-slate-600",
    pending: "bg-amber-50 text-amber-700",
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={`rounded-lg px-3 py-1 text-xs font-bold uppercase ${
        styles[status] || "bg-slate-100 text-slate-600"
      }`}
    >
      {status || "unknown"}
    </span>
  );
}

export default function SellerStorePage() {
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadStoreData() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [loadedStore, productPage] = await Promise.all([
        getMyStore(),
        getMySellerProducts(),
      ]);

      setStore(loadedStore);
      setProducts(productPage.items);
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not load seller store"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadStoreData();
  }, []);

  async function handleStoreSubmit(event) {
    event.preventDefault();
    const payload = getTrimmedFormData(event.currentTarget);

    if (hasEmptyRequiredFields(payload, ["name"])) {
      setErrorMessage(getEmptyFieldMessage());
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const updatedStore = await updateMyStore(payload);
      setStore(updatedStore);
      showToast("Store updated", "success");
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not update store"));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteProduct(product) {
    const reason = window.prompt(`Reason for deleting ${product.title}`);
    const trimmedReason = reason?.trim();

    if (!trimmedReason) {
      return;
    }

    if (trimmedReason.length < 10) {
      showToast("Deletion reason must be at least 10 characters");
      return;
    }

    setErrorMessage("");

    try {
      await deleteSellerProduct(product.id, trimmedReason);
      showToast("Product deleted", "success");
      await loadStoreData();
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not delete product"));
    }
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Seller"
          title="My store"
          text="Manage your storefront and product moderation queue."
          action={
            <Link
              to="/seller/products/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#4F8A5B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3F7148]"
            >
              <Plus size={18} />
              Add product
            </Link>
          }
        />

        {errorMessage && (
          <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
            Loading seller store...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
            <form
              onSubmit={handleStoreSubmit}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24"
            >
              <div className="mb-5 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
                  <Store size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Store settings
                  </h2>
                  <p className="text-sm text-slate-500">
                    Public seller profile
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                <FormField
                  label="Store name"
                  name="name"
                  required
                  minLength={3}
                  maxLength={100}
                  defaultValue={store?.name || ""}
                />
                <FormField
                  as="textarea"
                  label="Description"
                  name="description"
                  rows={5}
                  maxLength={300}
                  defaultValue={store?.description || ""}
                />
              </div>

              <Button type="submit" disabled={isSaving} className="mt-5 w-full">
                <Save size={17} />
                Save store
              </Button>
            </form>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Products
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Drafts and moderation requests from your store
                  </p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title="No products yet"
                    text="Create your first product and send it for moderation."
                    actionText="Add product"
                    onAction={() => navigate("/seller/products/new")}
                  />
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {products.map((product) => (
                    <article key={product.id} className="p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="h-24 w-24 rounded-lg object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="font-bold text-slate-950">
                              {product.title}
                            </h3>
                            <StatusBadge status={product.moderationStatus} />
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {product.category || "No category"} ·{" "}
                            {formatPrice(product.price)} · {product.quantity} pcs.
                          </p>

                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                            {product.description}
                          </p>

                          {product.rejectionReason && (
                            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                              {product.rejectionReason}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Link
                            to={`/seller/products/${product.id}/edit`}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B]"
                          >
                            <Edit size={16} />
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product)}
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </Container>
    </main>
  );
}
