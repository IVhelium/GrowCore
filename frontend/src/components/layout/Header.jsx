import { Search, Menu, Heart, User, ShoppingBag, X } from "lucide-react";
import { Popover } from "antd";
import { Link } from "react-router-dom";
import { useState } from "react";


export default function Header({
  user,
  cartCount = 0,
  savedCount = 0,
  onLogout
}) {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
       <Container/>
    </header>
  );
}
