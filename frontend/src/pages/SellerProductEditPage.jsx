import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ImagePlus, Save, Send, Trash2 } from "lucide-react";
import {
  deleteSellerProductImage,
  getMySellerProduct,
  submitSellerProduct,
  updateSellerProduct,
  uploadSellerProductImage,
} from "../api/productApi";
import Button from "../components/common/Button";
import Container from "../components/common/Container";
import FormField from "../components/common/FormField";
import ImageWithFallback from "../components/common/ImageWithFallback";
import PageHeader from "../components/common/PageHader";
import ProductAttributeEditor from "../components/product/ProductAttributeEditor";
import ProductDescriptionEditor from "../components/product/ProductDescriptionEditor";
import { useCategories } from "../hooks/useCategories";
import { getApiError } from "../utils/getApiError";
import { getTrimmedFormData } from "../utils/formSpaceValidation";
import {
  createAttributeRow,
  createRequiredAttributeRows,
  REQUIRED_ATTRIBUTE_NAMES,
} from "../utils/productAttributeOptions";
import { showToast } from "../utils/showToast";
import { validateFile } from "../utils/fileValidation";
import {
  clampDiscountInput,
  getLocalDateTimeInputValue,
  validateSellerProductForm,
} from "../utils/sellerProductFormValidation";

function toDateTimeLocalValue(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

export default function SellerProductEditPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { categories, isCategoriesLoading } = useCategories();
  const [product, setProduct] = useState(null);
  const [pendingImages, setPendingImages] = useState([]);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [submitAfterSave, setSubmitAfterSave] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [attributeRows, setAttributeRows] = useState(createRequiredAttributeRows);
  const errorRef = useRef(null);
  const canSubmitAfterSave = ["draft", "rejected"].includes(
    product?.moderationStatus,
  );

  function showError(message) {
    setErrorMessage(message);
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);
  }

  useEffect(() => {
    let isActive = true;

    async function loadProduct() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const loadedProduct = await getMySellerProduct(productId);

        if (isActive) {
          setProduct(loadedProduct);
          const loadedAttributes = Object.entries(
            loadedProduct.attributes || {},
          );
          const loadedAttributeNames = loadedAttributes.map(([name]) => name);
          const requiredRows = REQUIRED_ATTRIBUTE_NAMES.map((name) => {
            const [, value = ""] =
              loadedAttributes.find(([attributeName]) => attributeName === name) || [];

            return createAttributeRow(name, { value });
          });
          const optionalRows = loadedAttributes
            .filter(([name]) => !REQUIRED_ATTRIBUTE_NAMES.includes(name))
            .map(([name, value]) =>
              createAttributeRow(name, {
                value,
                isCustom: false,
              }),
            );

          setSelectedCategoryId(loadedProduct.categoryId || "");
          setAttributeRows(
            [...requiredRows, ...optionalRows].filter(
              (row, index, rows) =>
                loadedAttributeNames.includes(row.name) ||
                row.isRequired ||
                rows.findIndex((item) => item.name === row.name) === index,
            ),
          );
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(getApiError(error, "Could not load product"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isActive = false;
    };
  }, [productId]);

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

  async function handleDeleteImage(imageId) {
    setDeletingImageId(imageId);
    setErrorMessage("");

    try {
      const updatedProduct = await deleteSellerProductImage(productId, imageId);
      setProduct(updatedProduct);
      showToast("Product image deleted", "success");
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not delete product image"));
    } finally {
      setDeletingImageId(null);
    }
  }

  async function saveProduct(event) {
    event.preventDefault();
    const payload = getTrimmedFormData(event.currentTarget);
    const validationError = validateSellerProductForm(payload, attributeRows);

    if (validationError) {
      showError(validationError);
      return;
    }

    payload.attributes = getAttributes();

    setIsSaving(true);
    setErrorMessage("");

    try {
      let updatedProduct = await updateSellerProduct(productId, payload);

      for (const image of pendingImages) {
        updatedProduct = await uploadSellerProductImage(productId, image.file);
      }

      if (
        submitAfterSave &&
        ["draft", "rejected"].includes(updatedProduct.moderationStatus)
      ) {
        updatedProduct = await submitSellerProduct(updatedProduct.id);
        showToast("Product sent for moderation", "success");
      } else if (updatedProduct.moderationStatus === "pending") {
        showToast("Product sent for moderation", "success");
      } else {
        showToast("Product updated", "success");
      }

      setProduct(updatedProduct);
      navigate("/seller/store");
    } catch (error) {
      showError(getApiError(error, "Could not save product"));
    } finally {
      setIsSaving(false);
    }
  }

  function getAttributes() {
    return attributeRows.reduce((attributes, row) => {
      const name = row.name.trim();
      const value = String(row.value).trim();

      if (name && value) {
        attributes[name] = value;
      }

      return attributes;
    }, {});
  }

  if (isLoading) {
    return (
      <main>
        <Container className="py-8">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-500 shadow-sm">
            Loading product...
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Seller"
          title="Edit product"
          text="Update product details and resubmit rejected or draft products."
        />

        {errorMessage && (
          <p
            ref={errorRef}
            className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600"
          >
            {errorMessage}
          </p>
        )}

        <form
          onSubmit={saveProduct}
          noValidate
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"
        >
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                label="Product title"
                name="title"
                required
                minLength={5}
                maxLength={200}
                defaultValue={product?.title || ""}
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
                defaultValue={product?.originalPrice || product?.price || 0}
              />

              <FormField
                label="Discount (%)"
                name="discountPercent"
                type="number"
                min="0"
                max="99"
                step="0.01"
                defaultValue={product?.discountPercent || 0}
                onInput={clampDiscountInput}
              />

              <FormField
                label="Discount expires"
                name="discountExpiresAt"
                type="datetime-local"
                defaultValue={toDateTimeLocalValue(product?.discountExpiresAt)}
                min={getLocalDateTimeInputValue()}
              />

              <FormField
                label="Quantity"
                name="quantity"
                type="number"
                required
                min="0"
                step="1"
                defaultValue={product?.quantity || 0}
              />

              <ProductDescriptionEditor
                defaultValue={product?.description}
              />

              <ProductAttributeEditor
                rows={attributeRows}
                categories={categories}
                categoryId={selectedCategoryId}
                onChange={setAttributeRows}
              />
            </div>

            {canSubmitAfterSave ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  type="submit"
                  disabled={isSaving}
                  onClick={() => setSubmitAfterSave(false)}
                >
                  <Save size={17} />
                  Save draft
                </Button>
                <Button
                  type="submit"
                  style="secondary"
                  disabled={isSaving}
                  onClick={() => setSubmitAfterSave(true)}
                >
                  <Send size={17} />
                  Save and submit
                </Button>
              </div>
            ) : (
              <Button
                type="submit"
                disabled={isSaving}
                onClick={() => setSubmitAfterSave(false)}
                className="mt-6"
              >
                <Save size={17} />
                Save changes
              </Button>
            )}
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-slate-950">
              Product images
            </h2>
            {product?.imageItems?.length > 0 && (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {product.imageItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <ImageWithFallback
                      src={item.image}
                      alt=""
                      className="aspect-square w-full object-cover"
                      iconSize={24}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(item.id)}
                      disabled={deletingImageId === item.id || isSaving}
                      aria-label="Delete product image"
                      className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                    htmlFor="product-edit-image-upload"
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
                  htmlFor="product-edit-image-upload"
                  className="grid cursor-pointer place-items-center gap-3 py-10 text-slate-500 transition hover:text-[#4F8A5B]"
                >
                  <ImagePlus size={34} className="text-[#4F8A5B]" />
                  Upload product images
                </label>
              )}
              <input
                id="product-edit-image-upload"
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
