import { Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import {
  cartItems,
  products,
  savedProducts,
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
            cartCount={cartItems.length}
            savedCount={savedProducts.length}
          />
        }
      >
        <Route
          path="/"
          element={
            <HomePage
              products={products}
              onAddToCart={(product) => console.log("add", product)}
              onToggleFavorite={(product) => console.log("favorite", product)}
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
          path="/product/:productId"
          element={
            <ProductPage
              product={products[0]}
              relatedProducts={products.slice(1, 5)}
            />
          }
        />

        <Route
          path="/cart"
          element={
            <CartPage
              element={<CartPage items={cartItems}/>}
            />
          }
        />

        <Route path="*" element={<NotFoundPage/>}/>
      </Route>
    </Routes>
  );
}
