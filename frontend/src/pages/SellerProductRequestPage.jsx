import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, Send } from "lucide-react";
import {
  createSellerProduct,
  submitSellerProduct,
  uploadSellerProductImage,
} from "../api/productApi";
import Button from "../components/common/Button";
import Container from "../components/common/Container";
import FormField from "../components/common/FormField";
import PageHeader from "../components/common/PageHader";
import { useCategories } from "../hooks/useCategories";
import { getApiError } from "../utils/getApiError";
import { showToast } from "../utils/showToast";

export default function SellerProductRequestPage() {
  const navigate = useNavigate();
  const { categories, isCategoriesLoading } = useCategories();
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null;

    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!imageFile) {
      setErrorMessage("Add at least one product image before submission");
      return;
    }

    const payload = Object.fromEntries(new FormData(event.currentTarget));

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const createdProduct = await createSellerProduct(payload);
      const productWithImage = await uploadSellerProductImage(
        createdProduct.id,
        imageFile,
      );

      await submitSellerProduct(productWithImage.id);
      showToast("Product sent for moderation", "success");
      navigate("/seller/store");
    } catch (error) {
      setErrorMessage(getApiError(error, "Could not submit product request"));
    } finally {
      setIsSubmitting(false);
    }
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
          className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start"
        >
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            {errorMessage && (
              <p className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
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
                label="Quantity"
                name="quantity"
                type="number"
                required
                min="0"
                step="1"
                placeholder="10"
              />

              <label className="grid gap-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Description
                </span>
                <textarea
                  name="description"
                  required
                  minLength={20}
                  rows={7}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                  placeholder="Describe product compatibility, materials, use case and package details..."
                />
              </label>
            </div>

            <Button type="submit" disabled={isSubmitting} className="mt-6">
              <Send size={17} />
              Send for moderation
            </Button>
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="text-xl font-bold text-slate-950">
              Product image
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              One image is required before moderation.
            </p>

            <label className="mt-5 grid cursor-pointer place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center transition hover:border-[#4F8A5B] hover:bg-[#F2F8F3]">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt=""
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ) : (
                <span className="grid gap-3 place-items-center py-10 text-slate-500">
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
