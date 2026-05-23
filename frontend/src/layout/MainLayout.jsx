import { Outlet } from "react-router-dom";
import Header from "../components/layout/Header";
import TopBar from "../components/layout/TopBar"
import Footer from "../components/layout/Footer";
import MobileBottomNav from "../components/layout/MobileBottomNav";


export default function MainLayout({
    user,
    cartCount,
    savedCount,
    onSearch,
    onLogout
}) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <TopBar />
        <Header
          user={user}
          cartCount={cartCount}
          savedCount={savedCount}
          onSearch={onSearch}
          onLogout={onLogout}
        />
        <Outlet />          {/* Определяет расположение вложенного контента, верхняя часть лейаута остается неподвижной */}
        <Footer />
        <MobileBottomNav />
      </div>
    );
}