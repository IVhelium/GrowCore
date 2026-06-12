import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ImagePlus, Save, Send } from "lucide-react";
import {
  getMySellerProduct,
  submitSellerProduct,
  updateSellerProduct,
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
import {
  getEmptyFieldMessage,
  getTrimmedFormData,
  hasEmptyRequiredFields,
} from "../utils/formSpaceValidation";
import {
  hasFilledCharacteristics,
} from "../utils/productDescriptionTemplate";
import {
  createAttributeRow,
  createRequiredAttributeRows,
  REQUIRED_ATTRIBUTE_NAMES,
} from "../utils/productAttributeOptions";
import { showToast } from "../utils/showToast";

export default function SellerProductEditPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { categories, isCategoriesLoading } = useCategories();
  const [product, setProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitAfterSave, setSubmitAfterSave] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [attributeRows, setAttributeRows] = useState(createRequiredAttributeRows);

  useEffect(() => {
    let isActive = true;

    async function loadProduct() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const loadedProduct = await getMySellerProduct(productId);

        if (isActive) {
          setProduct(loadedProduct);
          setPreviewUrl(loadedProduct.image);
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
    const file = event.target.files?.[0] || null;
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : product?.image || "");
  }

  async function saveProduct(event) {
    event.preventDefault();
    const payload = getTrimmedFormData(event.currentTarget);

    if (
      hasEmptyRequiredFields(payload, [
        "title",
        "categoryId",
        "price",
        "quantity",
        "description",
      ])
    ) {
      setErrorMessage(getEmptyFieldMessage());
      return;
    }

    if (!hasFilledCharacteristics(payload.description)) {
      setErrorMessage("Fill Brand and Warranty in the Characteristics section");
      return;
    }

    payload.attributes = getAttributes();

    setIsSaving(true);
    setErrorMessage("");

    try {
      let updatedProduct = await updateSellerProduct(productId, payload);

      if (imageFile) {
        updatedProduct = await uploadSellerProductImage(productId, imageFile);
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
      setErrorMessage(getApiError(error, "Could not save product"));
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
          <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        <form
          onSubmit={saveProduct}
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
                defaultValue={product?.price || 0}
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

              <ProductDescriptionEditor defaultValue={product?.description} />

              <ProductAttributeEditor
                rows={attributeRows}
                categories={categories}
                categoryId={selectedCategoryId}
                onChange={setAttributeRows}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="submit"
                disabled={isSaving}
                onClick={() => setSubmitAfterSave(false)}
              >
                <Save size={17} />
                Save
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
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-slate-950">
              Product image
            </h2>
            <label className="mt-5 grid cursor-pointer place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-[#4F8A5B] hover:bg-[#F2F8F3]">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ) : (
                <span className="grid place-items-center gap-3 py-10 text-slate-500">
                  <ImagePlus size={34} className="text-[#4F8A5B]" />
                  Upload product image
                </span>
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleImageChange}
                className="sr-only"
              />
            </label>
          </aside>
        </form>
      </Container>
    </main>
  );
}
