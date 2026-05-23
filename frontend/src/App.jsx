import { Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import {
  cartItems,
  currentUser,
  orders,
  products,
  savedProducts,
  users,
} from "./data/testData"
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import CatalogPage from "./pages/CatalogPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";


export default function App() {

  return (
    <Routes>
      <Route
        element={
          <MainLayout
            user={currentUser}
            cartCount={cartItems.length}
            savedCount={savedProducts.length}
            onSearch={(query) => console.log("header search", query)}
            onLogout={() => console.log("logout")}
          />
        }
      >
        <Route
          path="/"
          element={
            <HomePage
              products={products}
            />
          }
        />

        <Route
          path="/catalog"
          element={
            <CatalogPage
              products={products}
              total={48}
            />
          }
        />

        <Route
          path="/product/"
          element={
            <ProductPage
              product={products[0]}
            />
          }
        />

        <Route
          path="/cart"
          element={
            <CartPage
              items={cartItems}
            />
          }
        />

        <Route path="*" element={<NotFoundPage/>}/>
      </Route>
    </Routes>
  );
}
