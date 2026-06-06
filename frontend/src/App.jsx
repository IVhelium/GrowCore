import { Route, Routes } from "react-router-dom";
import { moveFavoriteToCart } from "./api/favoritesApi";
import MainLayout from "./layout/MainLayout";
import { useCategories } from "./hooks/useCategories";
import { useCart } from "./hooks/useCart";
import { useFavorites } from "./hooks/useFavorites";
import { useAuth } from "./hooks/useAuth";
import { useProductCatalog, useProducts } from "./hooks/useProduct";
import { showToast } from "./utils/showToast";
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
import AdminPanelPage from "./pages/AdminPanelPage";
import SellerRequestPage from "./pages/SellerRequestPage";
import SellerStorePage from "./pages/SellerStorePage";
import SellerProductRequestPage from "./pages/SellerProductRequestPage";
import SupportPanelPage from "./pages/SupportPanelPage";
import SellerProductEditPage from "./pages/SellerProductEditPage";
import SupportPage from "./pages/SupportPage";
import OrderPage from "./pages/OrderPage";

export default function App() {
  const { isAuthenticated } = useAuth();
  const {
    products: backendProducts,
    productsError,
  } = useProducts();

  const { categories } = useCategories();
  
  const visibleProducts = productsError ? [] : backendProducts;

  const {
    cart,
    cartCount,
    addToCart,
    changeCartQuantity,
    removeFromCart,
    replaceCart,
    checkout,
  } = useCart();

  const {
    favorites,
    favoriteProductIds,
    toggleFavorite,
    removeFavoritesByFavoriteIds,
  } = useFavorites();

  const {
    catalogProducts,
    catalogTotal,
    catalogPageSize,
    currentPage,
    changeCatalogFilters,
    changeCatalogSort,
    setCurrentPage,
  } = useProductCatalog({
    products: visibleProducts,
    categories,
  });

  function canMoveFavoriteToCart(product, currentCart) {
    const cartItem = currentCart.find(
      (item) => String(item.productId) === String(product.id),
    );
    const maxQuantity = cartItem?.maxQuantity || product.quantity || 0;

    if (!cartItem) {
      return maxQuantity > 0;
    }

    return cartItem.quantity < maxQuantity;
  }

  async function moveFavoritesToCart() {
    let movedCount = 0;
    let skippedCount = 0;
    let currentCart = cart;

    for (const product of [...favorites]) {
      if (!canMoveFavoriteToCart(product, currentCart)) {
        skippedCount += 1;
        continue;
      }

      if (isAuthenticated && product.favoriteId) {
        try {
          const updatedCart = await moveFavoriteToCart(product.favoriteId);

          currentCart = updatedCart.items;
          replaceCart(updatedCart);
          removeFavoritesByFavoriteIds([product.favoriteId]);
          movedCount += 1;
        } catch {
          skippedCount += 1;
        }
        continue;
      }

      const updatedCart = await addToCart(product);

      if (updatedCart !== null || !isAuthenticated) {
        await toggleFavorite(product);
        movedCount += 1;
        currentCart = currentCart.map((item) =>
          String(item.productId) === String(product.id)
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        skippedCount += 1;
      }
    }

    if (movedCount > 0 && skippedCount > 0) {
      showToast("Available favorites moved to cart. Some stayed because the cart is already full");
    } else if (movedCount > 0) {
      showToast("Available favorites moved to cart", "success");
    } else if (skippedCount > 0) {
      showToast("Some favorites stayed because the cart already has the maximum quantity");
    }
  }

  return (
    <Routes>
      <Route
        element={
          <MainLayout
            cartCount={cartCount}
            savedCount={favorites.length}
            categories={categories}
          />
        }
      >
        <Route
          path="/"
          element={
            <HomePage
              products={visibleProducts}
              categories={categories}
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
              categories={categories}
              total={catalogTotal}
              currentPage={currentPage}
              pageSize={catalogPageSize}
              filterProducts={visibleProducts}
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
              onCheckout={checkout}
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
              onMoveAllToCart={moveFavoritesToCart}
              favoriteProductIds={favoriteProductIds}
            />
          }
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/orders" element={<OrderPage />} />
        </Route>

        <Route path="/users" element={<UsersSearchPage />} />

        <Route path="/seller-request" element={<SellerRequestPage/>}/>

        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminPanelPage />} />
          <Route path="/support-panel" element={<SupportPanelPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/seller/store" element={<SellerStorePage />} />
          <Route
            path="/seller/products/new"
            element={<SellerProductRequestPage />}
          />
          <Route
            path="/seller/products/:productId/edit"
            element={<SellerProductEditPage />}
          />
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
