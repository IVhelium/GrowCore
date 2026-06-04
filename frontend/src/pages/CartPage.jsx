
import { Link } from "react-router-dom";
import CartItem from "../components/cart/CartItem";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHader";

export default function CartPage({
  items = [],
  onQuantityChange,
  onRemove,
}) {
  if (!items.length) {
    return (
      <main>
        <Container className="py-8">
          <EmptyState
            title="Your cart is empty"
            text="Add products from the catalog and they will appear here."
          />
          <div className="mt-4 text-center">
            <Link className="font-semibold text-[#4F8A5B]" to="/catalog">
              Open catalog
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Cart"
          title="Your selected products"
          text="Review quantities before checkout."
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-4">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onQuantityChange={onQuantityChange}
                onRemove={onRemove}
              />
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
