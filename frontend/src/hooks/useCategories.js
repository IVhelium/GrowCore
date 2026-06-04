import { useEffect, useState } from "react";
import { getCategories } from "../api/categoriesApi";

// Frontend category state from the backend catalog endpoint.
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadCategories() {
      setIsCategoriesLoading(true);
      setCategoriesError(null);

      try {
        const backendCategories = await getCategories();

        // Stale request protection after component unmount.
        if (isActive) {
          setCategories(backendCategories);
        }
      } catch (error) {
        if (isActive) {
          setCategoriesError(error);
          setCategories([]);
        }
      } finally {
        if (isActive) {
          setIsCategoriesLoading(false);
        }
      }
    }

    loadCategories();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    categories,
    isCategoriesLoading,
    categoriesError,
  };
}
