import { useRef } from "react";
import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import PaginationBar from "../components/common/PaginationBar";
import ProductFilters from "../components/product/ProductFilters";
import ProductGrid from "../components/product/ProductGrid";
import ProductSort from "../components/product/ProductSort";
import SearchBar from "../components/search/SearchBar";

// Catalog page layout for search, filters, sorting, and paginated products.
export default function CatalogPage({
  products = [],
  categories = [],
  total = 0,
  currentPage = 1,
  pageSize = 12,
  searchValue = "",
  onSearch,
  onFilterChange,
  onSortChange,
  onPageChange,
  onAddToCart,
  onToggleFavorite,
  favoriteProductIds = [],
}) {
  const productsContainerRef = useRef(null);

  // Product grid scroll restoration after backend page changes.
  function handlePageChange(page) {
    onPageChange?.(page);
    productsContainerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Catalog"
          title="Garden automation parts"
          text="Sensors, irrigation parts, controllers, cables, and greenhouse replacement modules"
          action={<ProductSort onChange={onSortChange} />}
        />

        <SearchBar
          placeholder="Search in catalog..."
          buttonlabel="Search"
          defaultValue={searchValue}
          onSearch={onSearch}
          className="mb-6 shadow-sm"
        />

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <ProductFilters categories={categories} onChange={onFilterChange} />
          <div ref={productsContainerRef} className="scroll-mt-24">
            <ProductGrid
              products={products}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
            <PaginationBar
              current={currentPage}
              total={total}
              pageSize={pageSize}
              onChange={handlePageChange}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}
