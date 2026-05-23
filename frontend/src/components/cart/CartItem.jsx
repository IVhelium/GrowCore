import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "../../utils/formatPrice";


export default function CartItem({
    item,
    onQuantityChange,
    onRemove
}) {
    return (
        <article className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[120px_1fr_auto] sm:items-center">
            <div className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-slate-50">
                <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                />
            </div>

            <div>
                <h3 className="text-lg font-bold text-slate-950">{item.title}</h3>
                <p className="mt-1 text-sm text-slate-500">Unit price: {formatPrice(item.price)}</p>

                <div className="mt-4 inline-flex items-center rounded-lg border border-slate-200 bg-white p-1">
                    <button
                        className="grid h-9 w-9 place-items-center rounded-md hover:bg-slate-100"
                        onClick={() => onQuantityChange?.(item, Math.max(1, item.quantity - 1))}
                    >
                        <Minus size={16}/>
                    </button>
                    <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                        className="grid h-9 w-9 place-items-center rounded-md hover:bg-slate-100"
                        onClick={() => onQuantityChange?.(item, item.quantity + 1)}
                    >
                        <Plus size={16}/>
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 sm:block sm:text-right">
                <div className="text-xl font-black text-slate-950">
                    {formatPrice(item.price * item.quantity)}
                </div>
                <button
                    className="mt-0 rounded-lg bg-red-50  p-3 text-red-500 transition hover:bg-red-100 sm:mt-4"
                    onClick={() => onRemove?.(item)}
                >
                    <Trash2 size={18}/>
                </button>
            </div>
        </article>
    );
}