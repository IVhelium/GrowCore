import { useEffect, useState } from "react";
import { getCategories } from "../api/categoriesApi";

const CATEGORY_CACHE_KEY = "growcore:categories";
const CATEGORY_RETRY_DELAY_MS = 2000;

function readCachedCategories() {
  // Reads previous categories so the UI can display them before the API responds.
  if (typeof window === "undefined") { // localStorage exists only in the browser.
    return [];
  }

  try {
    return JSON.parse(window.localStorage.getItem(CATEGORY_CACHE_KEY)) || [];
  } catch {
    return [];
  }
}

function writeCachedCategories(categories) {
  // Saves non-empty category data for the next page load.
  if (typeof window === "undefined" || categories.length === 0) {
    return;
  }

  window.localStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(categories));
}

// Frontend category state from the backend catalog endpoint.
export function useCategories() {
  const [categories, setCategories] = useState(readCachedCategories);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState(null);

  useEffect(() => {
    let isActive = true;
    let retryTimer = null;

    async function loadCategories() {
      setIsCategoriesLoading(true);
      setCategoriesError(null);

      try {
        const backendCategories = await getCategories();

        // Stale request protection after component unmount.
        if (isActive) { // Prevents state changes after a component unmount.
          setCategories(backendCategories);
          writeCachedCategories(backendCategories);
        }
      } catch (error) {
        if (isActive) {
          setCategoriesError(error);
          retryTimer = window.setTimeout(
            loadCategories,
            CATEGORY_RETRY_DELAY_MS,
          );
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
      window.clearTimeout(retryTimer);
    };
  }, []);

  return {
    categories,
    isCategoriesLoading,
    categoriesError,
  };
}
