import { useMemo, useState } from "react";

export function useFavorites(initialProducts = []) {
  const [favorites, setFavorites] = useState(initialProducts.filter(Boolean));

  function toggleFavorite(product) {
    setFavorites((currentFavorites) => {
      const isSaved = currentFavorites.some(
        (item) => String(item.id) === String(product.id),
      );

      if (isSaved) {
        return currentFavorites.filter(
          (item) => String(item.id) !== String(product.id),
        );
      }

      return [...currentFavorites, product];
    });
  }

  const favoriteProductIds = useMemo(
    () => favorites.map((product) => String(product.id)),
    [favorites],
  );

  return {
    favorites,
    favoriteProductIds,
    toggleFavorite,
  };
}
