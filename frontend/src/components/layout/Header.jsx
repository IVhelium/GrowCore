import { Search, Menu, Heart, User, ShoppingBag, X } from "lucide-react";
import { Popover } from "antd";
import { Link } from "react-router-dom";
import logo from "/public/svg/growcore-logo-v2.svg";
import CatalogPopover from "../catalog/CatalogPopover.jsx";
import { useState } from "react";
import PromoBar from "./PromoBar.jsx";

export default function Header() {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  return (
    <>
      {isCatalogOpen && (
        <div
          className="fixed inset-0 z-998 bg-black/20 backdrop-blur-[1px]"
          onClick={() => setIsCatalogOpen(false)}
        />
      )}

      {/* <PromoBar /> */}
      <header className="flex sticky top-0 w-full h-23 items-center justify-center pr-[3.5px] z-50 bg-white">
        <div className="flex w-full max-w-7xl h-full justify-between items-center mx-auto text-[#111111]">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Shop logo" className="h-16 w-auto" />
          </Link>

          <Popover
            open={isCatalogOpen}
            onOpenChange={setIsCatalogOpen}
            content={<CatalogPopover onClose={() => setIsCatalogOpen(false)} />}
            trigger="click"
            placement="bottom"
            arrow={false}
            autoAdjustOverflow={false}
            classNames={{
              root: "catalog-popover-centered",
            }}
            styles={{
              body: { padding: 0 },
            }}
          >
            <button className="inline-flex items-center justify-center h-12 gap-3 shrink-0 px-3 py-2 bg-[#7188D4] text-[#FFFFFF] cursor-pointer rounded-lg">
              <span className="text-[1.2rem] font-medium">Catalog</span>
              {isCatalogOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </Popover>

          <Search className="header-icon" />
          <User className="header-icon" />
          <Heart className="header-icon" />
          <ShoppingBag className="header-icon" />
        </div>
      </header>
    </>
  );
}
