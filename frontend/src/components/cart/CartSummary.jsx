import { formatPrice } from "../../utils/formatPrice";
import Button from "../common/Button";


export default function CartSummary({
    items = [],
    onCheckout
}) {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const count = items.length;

    return (
        <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-2xl font-bold text-slate-950">Order summary</h2>

            <div className="mt-5 grid gap-3 text-sm text-slate-500">
                <div className="flex justify-between">
                    <span>Items</span>
                    <span>{count}</span>
                </div>
                <div className="flex justify-between">
                    <span>Delivery</span>
                    <span>Calculated later</span>
                </div>
            </div>

            <div className="my-5 h-px bg-slate-100"/>

            <div className="flex items-center justify-between gap-4">
                <span className="font-bold text-slate-950">Total</span>
                <span className="text-2xl font-black text-slate-950">{formatPrice(total)}</span>
            </div>

            <Button
                onClick={onCheckout}
                size="lg"
                className="mt-6 w-full"
            >
                Checkout
            </Button>
        </aside>
    );
}
