import { PackageSearch } from "lucide-react";
import Button from "./Button"


export default function EmptyState({
    title, 
    text,
    actionText,
    onAction
}) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-lg bg-[#4F8A5B]/10 text-[#4F8A5B]">
            <PackageSearch size={32}/>
        </div>
        <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-slate-500">{text}</p>
        {actionText && <Button className="mt-6" onClick={onAction}>{actionText}</Button>}
      </div>
    );
}