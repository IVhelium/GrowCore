import { Search, Menu, Heart, User, ShoppingBag } from "lucide-react";


function header() {
    return (
      <header className="flex w-full h-23 justify-between items-center px-4 z-40 text-[#111111]">
        <h1>GrowCore</h1>
        <button className="inline-flex items-center justify-center h-12 gap-2 px-3 py-2 bg-[#7188D4] text-[#FFFFFF] rounded-lg">
          <span>Catalog</span>
          <Menu />
        </button>
        <search className="inline-flex w-28">

          <Search />
        </search>

        <Heart />
        <User />
        <ShoppingBag />
      </header>
    );
}

export default header