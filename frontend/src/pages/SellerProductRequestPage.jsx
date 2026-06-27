import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, Send, Trash2 } from "lucide-react";
import {
  createSellerProduct,
  submitSellerProduct,
  uploadSellerProductImage,
} from "../api/productApi";
import Button from "../components/common/Button";
import Container from "../components/common/Container";
import FormField from "../components/common/FormField";
import PageHeader from "../components/common/PageHader";
import ProductAttributeEditor from "../components/product/ProductAttributeEditor";
import ProductDescriptionEditor from "../components/product/ProductDescriptionEditor";
import { useCategories } from "../hooks/useCategories";
import { getApiError } from "../utils/getApiError";
import { getTrimmedFormData } from "../utils/formSpaceValidation";
import { createRequiredAttributeRows } from "../utils/productAttributeOptions";
import { showToast } from "../utils/showToast";
import { useAuth } from "../hooks/useAuth";
import { validateFile } from "../utils/fileValidation";
import {
  clampDiscountInput,
  getLocalDateTimeInputValue,
  validateSellerProductForm,
} from "../utils/sellerProductFormValidation";

export default function SellerProductRequestPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { categories, isCategoriesLoading } = useCategories();
  const [pendingImages, setPendingImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [attributeRows, setAttributeRows] = useState(createRequiredAttributeRows);
  const errorRef = useRef(null);

  function showError(message) {
    setErrorMessage(message);
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  function handleImageChange(event) {
    const files = Array.from(event.target.files || []);

    for (const file of files) {
      const validationError = validateFile(file, {
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
        maxSizeMb: 8,
        label: "Product image",
      });
      if (validationError) {
        showError(validationError);
        event.target.value = "";
        return;
      }
    }

    setErrorMessage("");
    setPendingImages((currentImages) => [
      ...currentImages,
      ...files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
    event.target.value = "";
  }

  function removePendingImage(imageId) {
    setPendingImages((currentImages) => {
      const imageToRemove = currentImages.find((image) => image.id === imageId);

      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return currentImages.filter((image) => image.id !== imageId);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (user?.isBlocked) {
      showError("Your seller account is blocked. Contact support to restore product publishing.");
      return;
    }

    if (pendingImages.length === 0) {
      showError("Add at least one product image before submission");
      return;
    }

    const payload = getTrimmedFormData(event.currentTarget);
    const validationError = validateSellerProductForm(payload, attributeRows);

    if (validationError) {
      showError(validationError);
      return;
    }

    payload.attributes = getAttributes();

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const createdProduct = await createSellerProduct(payload);
      let productWithImages = createdProduct;

      for (const image of pendingImages) {
        productWithImages = await uploadSellerProductImage(
          createdProduct.id,
          image.file,
        );
      }

      await submitSellerProduct(productWithImages.id);
      showToast("Product sent for moderation", "success");
      navigate("/seller/store");
    } catch (error) {
      showError(getApiError(error, "Could not submit product request"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function getAttributes() {
    return attributeRows.reduce((attributes, row) => {
      const name = row.name.trim();
      const value = row.value.trim();

      if (name && value) {
        attributes[name] = value;
      }

      return attributes;
    }, {});
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Seller"
          title="Add product"
          text="Create a product card and send it to administrator moderation."
        />

        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"
        >
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            {user?.isBlocked && (
              <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                Your seller account is blocked. Product publishing is disabled. Contact support for help.
              </p>
            )}

            {errorMessage && (
              <p
                ref={errorRef}
                className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600"
              >
                {errorMessage}
              </p>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Product title"
                name="title"
                required
                minLength={5}
                maxLength={200}
                placeholder="Smart irrigation valve"
              />

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-slate-700">
                  Category
                </span>
                <select
                  name="categoryId"
                  required
                  disabled={isCategoriesLoading}
                  value={selectedCategoryId}
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <FormField
                label="Price"
                name="price"
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="24.99"
              />

              <FormField
                label="Discount (%)"
                name="discountPercent"
                type="number"
                min="0"
                max="99"
                step="0.01"
                defaultValue="0"
                placeholder="0"
                onInput={clampDiscountInput}
              />

              <FormField
                label="Discount expires"
                name="discountExpiresAt"
                type="datetime-local"
                min={getLocalDateTimeInputValue()}
              />

              <FormField
                label="Quantity"
                name="quantity"
                type="number"
                required
                min="0"
                step="1"
                placeholder="10"
              />

              <ProductDescriptionEditor />

              <ProductAttributeEditor
                rows={attributeRows}
                categories={categories}
                categoryId={selectedCategoryId}
                onChange={setAttributeRows}
              />
            </div>

            <Button type="submit" disabled={isSubmitting || user?.isBlocked} className="mt-6">
              <Send size={17} />
              Send for moderation
            </Button>
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-slate-950">
              Product images
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add one or more images before moderation.
            </p>

            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              {pendingImages.length > 0 ? (
                <span className="grid w-full grid-cols-2 gap-3">
                  {pendingImages.map((image) => (
                    <span
                      key={image.id}
                      className="relative overflow-hidden rounded-lg bg-white"
                    >
                      <img
                        src={image.previewUrl}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          removePendingImage(image.id);
                        }}
                        aria-label="Remove selected image"
                        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-lg bg-white/90 text-red-600 shadow-sm transition hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </span>
                  ))}
                  <label
                    htmlFor="product-image-upload"
                    className="grid aspect-square cursor-pointer place-items-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-500 transition hover:border-[#4F8A5B] hover:bg-[#F2F8F3]"
                  >
                    <span className="grid place-items-center gap-2 text-sm font-semibold">
                      <ImagePlus size={24} className="text-[#4F8A5B]" />
                      Add more
                    </span>
                  </label>
                </span>
              ) : (
                <label
                  htmlFor="product-image-upload"
                  className="grid cursor-pointer place-items-center gap-3 py-10 text-slate-500 transition hover:text-[#4F8A5B]"
                >
                  <ImagePlus size={34} className="text-[#4F8A5B]" />
                  Upload product images
                </label>
              )}
              <input
                id="product-image-upload"
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="sr-only"
              />
            </div>
          </aside>
        </form>
      </Container>
    </main>
  );
}
