export function sortProducts(products, sortValue) {
  // Sorts a copy of products so the original catalogue state is unchanged.
  const sortedProducts = [...products];

  if (sortValue === "popular") { // Highest product rating first.
    return sortedProducts.sort((a, b) => b.rating - a.rating);
  }

  if (sortValue === "price-asc") {
    return sortedProducts.sort((a, b) => a.price - b.price);
  }

  if (sortValue === "price-des") {
    return sortedProducts.sort((a, b) => b.price - a.price);
  }

  if (sortValue === "new") {
    return sortedProducts.sort((a, b) => b.id - a.id);
  }

  return sortedProducts;
}

export function filterProducts({
  products,
  categories,
  categoryValue,
  filters,
  searchValue,
}) {
  // Applies search text, category, price, seller, stock, and attribute filters.
  const categoryName =
    categories.find((category) => String(category.id) === String(categoryValue))
      ?.name || categoryValue;

  const minPrice = Number(filters.minPrice) || 0;
  const maxPrice = Number(filters.maxPrice) || Infinity;
  const labels = Array.isArray(filters.label)
    ? filters.label
    : filters.label
      ? [filters.label]
      : [];
  const sellers = Array.isArray(filters.seller)
    ? filters.seller
    : filters.seller
      ? [filters.seller]
      : [];
  const availability = Array.isArray(filters.availability)
    ? filters.availability
    : filters.availability
      ? [filters.availability]
      : [];
  const attributeFilters = filters.attributes || {};

  return products.filter((product) => {
    const query = searchValue.trim().toLowerCase();
    const matchesSearch = // Searches title, description, and category without case sensitivity.
      !query ||
      product.title.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query);

    const matchesCategory = !categoryName || product.category === categoryName;
    const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
    const matchesLabel = labels.length === 0 || labels.includes(product.label);
    const matchesSeller =
      sellers.length === 0 || sellers.includes(product.store?.name || "");
    const matchesAvailability =
      availability.length === 0 ||
      availability.some((value) =>
        value === "ready" ? product.quantity > 0 : product.quantity <= 0,
      );
    const matchesAttributes = Object.entries(attributeFilters).every(
      ([name, values]) => {
        const selectedValues = Array.isArray(values) ? values : [values];
        return selectedValues.includes(product.attributes?.[name]);
      },
    );

    return (
      matchesSearch &&
      matchesCategory &&
      matchesPrice &&
      matchesLabel &&
      matchesSeller &&
      matchesAvailability &&
      matchesAttributes
    );
  });
}
