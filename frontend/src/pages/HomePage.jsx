import { useMemo, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import { randomArray } from "../utils/randomArray";
import { usePagination } from "../hooks/usePagination";
import Container from "../components/common/Container";
import Hero from "../components/home/Hero";
import SectionTitle from "../components/common/SectionTitle";
import ProductGrid from "../components/product/ProductGrid";
import PaginationBar from "../components/common/PaginationBar";
import Benefits from "../components/home/Benefits";

const HOME_PAGE_SIZE = 12;

export default function HomePage({
  products = [],
  onAddToCart,
  onToggleFavorite,
  favoriteProductIds = [],
}) {
  const productsSectionRef = useRef(null);
  const randomProducts = useMemo(() => randomArray(products), [products]);
  const {
    currentPage,
    pageItems,
    pageSize,
    total,
    changePage,
  } = usePagination(randomProducts, HOME_PAGE_SIZE);

  function handlePageChange(page) {
    changePage(page);
    productsSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main>
      <Container className="grid gap-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <Sidebar />

        <div className="min-w-0 space-y-10">
          <Hero />
          <section id="products" ref={productsSectionRef} className="scroll-mt-24">
            <SectionTitle pretitle="Products" title="Product for your system" />
            <ProductGrid
              products={pageItems}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
            <PaginationBar
              current={currentPage}
              total={total}
              pageSize={pageSize}
              onChange={handlePageChange}
              hideWhenSinglePage={false}
            />
          </section>

          <section>
            <SectionTitle pretitle="Service" title="Why choose GrowCore" />
            <Benefits />
          </section>
        </div>
      </Container>
    </main>
  );
}
