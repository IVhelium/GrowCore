import { useEffect, useMemo, useState } from "react";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "../api/favoritesApi";
import { showToast } from "../utils/showToast";
import { useAuth } from "./useAuth";

const EMPTY_FAVORITES = [];

export function useFavorites(initialProducts = EMPTY_FAVORITES) {
  const [favorites, setFavorites] = useState(initialProducts.filter(Boolean));
  const [favoritesError, setFavoritesError] = useState(null);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let isActive = true;

    async function loadFavorites() {
      if (!isAuthenticated) {
        setFavorites(initialProducts.filter(Boolean));
        setFavoritesError(null);
        setIsFavoritesLoading(false);
        return;
      }

      setIsFavoritesLoading(true);
      setFavoritesError(null);

      try {
        const favoritePage = await getFavorites();

        if (isActive) {
          setFavorites(favoritePage.items);
        }
      } catch (error) {
        if (isActive) {
          setFavoritesError(error);
          setFavorites([]);
        }
      } finally {
        if (isActive) {
          setIsFavoritesLoading(false);
        }
      }
    }

    loadFavorites();

    return () => {
      isActive = false;
    };
  }, [initialProducts, isAuthenticated]);

  async function toggleFavorite(product) {
    const savedProduct = favorites.find(
      (item) => String(item.id) === String(product.id),
    );

    if (isAuthenticated) {
      try {
        if (savedProduct?.favoriteId) {
          await removeFavorite(savedProduct.favoriteId);
          setFavorites((currentFavorites) =>
            currentFavorites.filter(
              (item) => String(item.id) !== String(product.id),
            ),
          );
          setFavoritesError(null);
          showToast("Removed from favorites", "success");
          return;
        }

        const createdFavorite = await addFavorite(product.id);
        setFavorites((currentFavorites) => {
          const isSaved = currentFavorites.some(
            (item) => String(item.id) === String(product.id),
          );

          if (isSaved) {
            return currentFavorites;
          }

          return [...currentFavorites, createdFavorite];
        });
        setFavoritesError(null);
        showToast("Added to favorites", "success");
      } catch (error) {
        setFavoritesError(error);
      }

      return;
    }

    setFavorites((currentFavorites) => {
      const isSaved = currentFavorites.some(
        (item) => String(item.id) === String(product.id),
      );

      if (isSaved) {
        showToast("Removed from favorites", "success");
        return currentFavorites.filter(
          (item) => String(item.id) !== String(product.id),
        );
      }

      showToast("Added to favorites", "success");
      return [...currentFavorites, product];
    });
  }

  function removeFavoritesByFavoriteIds(favoriteIds) {
    const favoriteIdSet = new Set(favoriteIds.map((id) => String(id)));

    setFavorites((currentFavorites) =>
      currentFavorites.filter(
        (product) => !favoriteIdSet.has(String(product.favoriteId)),
      ),
    );
    setFavoritesError(null);
  }

  const favoriteProductIds = useMemo(
    () => favorites.map((product) => String(product.id)),
    [favorites],
  );

  return {
    favorites,
    favoriteProductIds,
    favoritesError,
    isFavoritesLoading,
    toggleFavorite,
    removeFavoritesByFavoriteIds,
  };
}
