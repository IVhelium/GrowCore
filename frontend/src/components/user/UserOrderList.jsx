import { Package } from "lucide-react";
import EmptyState from "../common/EmptyState";
import { formatPrice } from "../../utils/formatPrice";


export default function UserOrderList({ orders = [] }) {
    return (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-950">My orders</h2>
                    <p className="mt-1 text-slate-500">Your order history</p>
                </div>
                <Package className="text-[#4F8A5B]"/>
            </div>

            {!orders.length ? (
                <EmptyState 
                    title="No orders yet"
                    text="Your orders will appear here after checkout"
                />
            ) : (
                <div className="grid gap-4">
                    {orders.map((order) => (
                        <article
                            key={order.id}
                            className="rounded-xl border border-slate-200 p-5"
                        >
                            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <h3 className="font-bold text-slate-950">Order #{order.id}</h3>
                                    <p className="text-sm text-slate-500">{order.date}</p>
                                    <p className="text-sm text-slate-500">Status: {order.status}</p>
                                </div>
                                <div className="text-lg font-bold text-slate-950">{formatPrice(order.total)}</div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}