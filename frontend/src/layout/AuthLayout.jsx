import { Leaf } from "lucide-react";
import { Link, Outlet } from "react-router-dom";



export default function AuthLayout() {
    return (
      <div className="grid min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto w-full max-w-md self-center rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <Link
            to="/"
            className="mb-8 flex items-center justify-center gap-2 text-3xl font-black text-[#4F8A5B]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#4F8A5B] text-white">
              <Leaf size={24}/>
            </span>
            GrowCore
          </Link>
          <Outlet/>   {/* Определяет расположение вложенного контента, верхняя часть лейаута остается неподвижной */}
        </div>
      </div>
    );
}