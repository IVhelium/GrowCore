import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../api/productApi";

const CATALOG_PAGE_SIZE = 32;

export function useProducts() {
  // Loads the product list used by pages outside the filtered catalogue.
  const [products, setProducts] = useState([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadProducts() {
      setIsProductsLoading(true);
      setProductsError(null);

      try {
        const productPage = await getProducts();

        if (isActive) {
          setProducts(productPage.items);
        }
      } catch (error) {
        if (isActive) {
          setProductsError(error);
          setProducts([]);
        }
      } finally {
        if (isActive) {
          setIsProductsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    products,
    isProductsLoading,
    productsError,
  };
}

export function useProductCatalog() {
  // Loads a filtered and paginated catalogue based on URL search parameters.
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const [sortValue, setSortValue] = useState("random");
  const [currentPage, setCurrentPage] = useState(1);
  const [backendCatalogPage, setBackendCatalogPage] = useState({
    items: [],
    total: 0,
  });
  const [catalogError, setCatalogError] = useState(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);

  const searchValue = searchParams.get("search") || "";
  const categoryValue = searchParams.get("category") || filters.category || "";
  const categoryId = /^\d+$/.test(categoryValue) ? Number(categoryValue) : null; // Uses only a numeric category ID.

  useEffect(() => {
    let isActive = true;

    async function loadCatalogPage() {
      setIsCatalogLoading(true);
      setCatalogError(null);

      try {
        const productPage = await getProducts({
          limit: CATALOG_PAGE_SIZE,
          offset: (currentPage - 1) * CATALOG_PAGE_SIZE,
          search: searchValue,
          categoryId,
          filters,
          sort: sortValue,
        });

        if (isActive) {
          const maxPage = Math.max(
            1,
            Math.ceil(productPage.total / CATALOG_PAGE_SIZE),
          );

          if (currentPage > maxPage) {
            setCurrentPage(maxPage);
            return;
          }

          setBackendCatalogPage({
            items: productPage.items,
            total: productPage.total,
          });
        }
      } catch (error) {
        if (isActive) {
          setCatalogError(error);
          setBackendCatalogPage({
            items: [],
            total: 0,
          });
        }
      } finally {
        if (isActive) {
          setIsCatalogLoading(false);
        }
      }
    }

    loadCatalogPage();

    return () => {
      isActive = false;
    };
  }, [categoryId, currentPage, filters, searchValue, sortValue]);

  const catalogProducts = backendCatalogPage.items;
  const catalogTotal = backendCatalogPage.total;

  function searchCatalog(query) {
    // Stores the search text in the URL so the catalogue link can be shared.
    const params = new URLSearchParams(searchParams);

    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }

    setSearchParams(params);
    setCurrentPage(1);
  }

  function changeCatalogFilters(nextFilters) {
    // Updates filters and resets pagination to the first results page.
    setFilters(nextFilters);

    const params = new URLSearchParams(searchParams);

    if (nextFilters.category) {
      params.set("category", nextFilters.category);
    } else {
      params.delete("category");
    }

    setSearchParams(params);
    setCurrentPage(1);
  }

  function changeCatalogSort(nextSortValue) {
    // Changes product ordering and returns the user to page one.
    setSortValue(nextSortValue);
    setCurrentPage(1);
  }

  return {
    catalogProducts,
    catalogTotal,
    catalogPageSize: CATALOG_PAGE_SIZE,
    currentPage,
    isCatalogLoading,
    catalogError,
    searchValue,
    searchCatalog,
    changeCatalogFilters,
    changeCatalogSort,
    setCurrentPage,
  };
}
