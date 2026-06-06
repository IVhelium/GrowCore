import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PackageCheck } from "lucide-react";
import { getOrders } from "../api/orderApi";
import Container from "../components/common/Container";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHader";
import { formatPrice } from "../utils/formatPrice";

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function loadOrders() {
      setIsLoading(true);

      try {
        const loadedOrders = await getOrders();

        if (isActive) {
          setOrders(loadedOrders);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <main>
      <Container className="py-8">
        <PageHeader
          pretitle="Orders"
          title="Order history"
          text="Products from completed checkout stay here with quantities, prices, and status."
        />

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Loading orders...
          </div>
        ) : !orders.length ? (
          <EmptyState
            title="No orders yet"
            text="After checkout, purchased products will appear here."
          />
        ) : (
          <div className="grid gap-5">
            {orders.map((order) => (
              <article
                key={order.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
                      <PackageCheck size={22} />
                    </span>
                    <div>
                      <h2 className="font-bold text-slate-950">
                        Order #{order.id}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {formatDate(order.date)} · {order.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-xl font-black text-slate-950">
                    {formatPrice(order.total)}
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {order.items.map((item) => (
                    <Link
                      key={item.id}
                      to={`/product/${item.productId}`}
                      className="flex items-center gap-4 rounded-lg border border-slate-100 p-3 transition hover:border-[#4F8A5B]"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-slate-950">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="text-sm font-bold text-slate-950">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
