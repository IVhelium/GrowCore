import { Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import { categories, cartItems, products, savedProducts } from "./data/testData";
import { useCart } from "./hooks/useCart";
import { useFavorites } from "./hooks/useFavorites";
import { useProductCatalog, useProducts } from "./hooks/useProduct";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import CatalogPage from "./pages/CatalogPage";
import CartPage from "./pages/CartPage";
import UsersSearchPage from "./pages/UsersSearchPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import ProductRoute from "./routes/ProductRoute";
import ProfilePage from "./pages/ProfilePage";
import AuthLayout from "./layout/AuthLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FavoritesPage from "./pages/FavoritesPage";

export default function App() {
  const {
    products: backendProducts,
    productsError,
  } = useProducts();
  const visibleProducts =
    productsError || backendProducts.length === 0
      ? products
      : backendProducts;

  const {
    cart,
    cartCount,
    addToCart,
    changeCartQuantity,
    removeFromCart,
  } = useCart(cartItems);

  const {
    favorites,
    favoriteProductIds,
    toggleFavorite,
  } = useFavorites(savedProducts);

  const {
    catalogProducts,
    catalogTotal,
    catalogPageSize,
    currentPage,
    searchValue,
    searchCatalog,
    changeCatalogFilters,
    changeCatalogSort,
    setCurrentPage,
  } = useProductCatalog({
    products: visibleProducts,
    categories,
  });

  return (
    <Routes>
      <Route
        element={
          <MainLayout cartCount={cartCount} savedCount={favorites.length} />
        }
      >
        <Route
          path="/"
          element={
            <HomePage
              products={visibleProducts}
              onAddToCart={addToCart}
              onToggleFavorite={toggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
          }
        />

        <Route
          path="/catalog"
          element={
            <CatalogPage
              products={catalogProducts}
              total={catalogTotal}
              currentPage={currentPage}
              pageSize={catalogPageSize}
              searchValue={searchValue}
              onSearch={searchCatalog}
              onFilterChange={changeCatalogFilters}
              onSortChange={changeCatalogSort}
              onPageChange={setCurrentPage}
              onAddToCart={addToCart}
              onToggleFavorite={toggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
          }
        />

        <Route
          path="/product/:productId"
          element={
            <ProductRoute
              products={visibleProducts}
              onAddToCart={addToCart}
              onToggleFavorite={toggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
          }
        />

        <Route
          path="/cart"
          element={
            <CartPage
              items={cart}
              onQuantityChange={changeCartQuantity}
              onRemove={removeFromCart}
            />
          }
        />

        <Route
          path="/favorites"
          element={
            <FavoritesPage
              products={favorites}
              onAddToCart={addToCart}
              onToggleFavorite={toggleFavorite}
              favoriteProductIds={favoriteProductIds}
            />
          }
        />

        <Route path="/users" element={<UsersSearchPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
