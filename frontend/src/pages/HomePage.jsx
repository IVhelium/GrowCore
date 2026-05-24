import { useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import { randomArray } from "../utils/randomArray";
import Container from "../components/common/Container";
import Hero from "../components/home/Hero";
import SectionTitle from "../components/common/SectionTitle";
import ProductGrid from "../components/product/ProductGrid";
import PaginationBar from "../components/common/PaginationBar";
import Benefits from "../components/home/Benefits";


export default function HomePage({
  products = [],
  onAddToCart,
  onToggleFavorite
}) {
  const randomProducts = useMemo(() => randomArray(products), [products]);

  return (
    <main>
      <Container className="grid gap-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <Sidebar />

        <div className="min-w-0 space-y-10">
          <Hero />
          <section id="products">
            <SectionTitle
              pretitle="Products"
              title="Product for your system"
            />
            <ProductGrid
              products={randomProducts}
              onAddToCart={onAddToCart}
              onToggleFavorite={onToggleFavorite}
            />
            <PaginationBar current={1} total={48} pageSize={8} />
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