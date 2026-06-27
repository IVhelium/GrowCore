import { Minus, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import ImageWithFallback from "../common/ImageWithFallback";
import { formatPrice } from "../../utils/formatPrice";


export default function CartItem({
    item,
    onQuantityChange,
    onRemove
}) {
    const maxQuantity = item.maxQuantity || item.product?.quantity || Infinity;
    const isMaxQuantity = item.quantity >= maxQuantity;

    return (
        <article className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[120px_1fr_auto] sm:items-center">
            <Link
                to={`/product/${item.productId || item.product?.id}`}
                className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-slate-50"
            >
                <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    iconSize={34}
                />
            </Link>

            <div>
                <Link
                    to={`/product/${item.productId || item.product?.id}`}
                    className="text-lg font-bold text-slate-950 transition hover:text-[#4F8A5B]"
                >
                    {item.title}
                </Link>
                <p className="mt-1 text-sm text-slate-500">
                    Unit price: {formatPrice(item.price)}
                    {item.oldPrice && (
                        <span className="ml-2 text-slate-400 line-through">
                            {formatPrice(item.oldPrice)}
                        </span>
                    )}
                </p>

                <div className="mt-4 inline-flex items-center rounded-lg border border-slate-200 bg-white p-1">
                    <button
                        className="grid h-9 w-9 place-items-center rounded-md hover:bg-slate-100"
                        onClick={() => onQuantityChange?.(item, Math.max(1, item.quantity - 1))}
                    >
                        <Minus size={16}/>
                    </button>
                    <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                        className="grid h-9 w-9 place-items-center rounded-md hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white"
                        disabled={isMaxQuantity}
                        title={isMaxQuantity ? "No more items in stock" : undefined}
                        onClick={() => onQuantityChange?.(item, Math.min(maxQuantity, item.quantity + 1))}
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
