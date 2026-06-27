import {
  hasFilledCharacteristics,
  parseProductDescription,
  PRODUCT_DESCRIPTION_SECTIONS,
} from "./productDescriptionTemplate";

export function getLocalDateTimeInputValue(date = new Date()) {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
}

export function clampDiscountInput(event) {
  const value = event.currentTarget.value;

  if (value === "") return;

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    event.currentTarget.value = "";
    return;
  }

  if (numericValue > 99) {
    event.currentTarget.value = "99";
  }

  if (numericValue < 0) {
    event.currentTarget.value = "0";
  }
}

export function validateSellerProductForm(payload, attributeRows = []) {
  const title = String(payload.title || "").trim();
  const price = Number(payload.price);
  const discountPercent = Number(payload.discountPercent || 0);
  const quantity = Number(payload.quantity);

  if (!title) {
    return "Enter a product title.";
  }

  if (title.length < 5) {
    return "Product title must be at least 5 characters.";
  }

  if (!payload.categoryId) {
    return "Select a product category.";
  }

  if (payload.price === "" || Number.isNaN(price)) {
    return "Enter a valid price.";
  }

  if (price < 0) {
    return "Price cannot be negative.";
  }

  if (Number.isNaN(discountPercent)) {
    return "Enter a valid discount.";
  }

  if (discountPercent < 0 || discountPercent > 99) {
    return "Discount must be between 0 and 99%.";
  }

  if (payload.discountExpiresAt) {
    const expiresAt = new Date(payload.discountExpiresAt);

    if (Number.isNaN(expiresAt.getTime())) {
      return "Enter a valid discount expiry date.";
    }

    if (expiresAt < new Date()) {
      return "Discount expiry cannot be in the past.";
    }
  }

  if (payload.quantity === "" || Number.isNaN(quantity)) {
    return "Enter available quantity.";
  }

  if (!Number.isInteger(quantity) || quantity < 0) {
    return "Quantity must be a whole number from 0 and above.";
  }

  const descriptionSections = parseProductDescription(payload.description || "");
  const hasEmptyDescriptionSection = PRODUCT_DESCRIPTION_SECTIONS
    .filter((section) => section.key !== "characteristics")
    .some((section) => !descriptionSections[section.key]?.trim());

  if (hasEmptyDescriptionSection || !hasFilledCharacteristics(payload.description || "")) {
    return "Fill all description sections, Brand, and Warranty.";
  }

  const brandRow = attributeRows.find((row) => row.name === "Brand");
  const warrantyRow = attributeRows.find((row) => row.name === "Warranty");

  if (!brandRow?.value?.trim()) {
    return "Enter the product brand.";
  }

  if (!warrantyRow?.value?.trim()) {
    return "Enter the product warranty.";
  }

  return "";
}
