import Container from "../components/common/Container";
import PageHeader from "../components/common/PageHader";
import PaginationBar from "../components/common/PaginationBar";
import ProductFilters from "../components/product/ProductFilters";
import ProductGrid from "../components/product/ProductGrid";
import ProductSort from "../components/product/ProductSort";
import SearchBar from "../components/search/SearchBar";

export default function CatalogPage({
  products = [],
  total = 0,
  onSearch,
  onFilterChange,
  onSortChange,
  onPageChange,
  onAddToCart,
  onToggleFavorite,
}) {
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
          onSearch={onSearch}
          className="mb-6 shadow-sm"
        />

        <div className="grid gap-6 lg:grid-clos-[280px_minmax(0,1fr)]">
          <ProductFilters onChange={onFilterChange} />
          <div>
            <ProductGrid
              products={products}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
            />
            <PaginationBar
              current={1}
              total={total}
              pageSize={8}
              onChange={onPageChange}
            />
          </div>
        </div>
      </Container>
    </main>
  );
}
