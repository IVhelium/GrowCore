import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getProducts } from "../api/productApi";
import { filterProducts, sortProducts } from "../utils/productCatalog";

const CATALOG_PAGE_SIZE = 12;

export function useProducts() {
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

export function useProductCatalog({
  products = [],
  categories = [],
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const [sortValue, setSortValue] = useState("random");
  const [currentPage, setCurrentPage] = useState(1);

  const searchValue = searchParams.get("search") || "";
  const categoryValue = searchParams.get("category") || filters.category || "";

  const sortedCatalogProducts = useMemo(() => {
    const filteredProducts = filterProducts({
      products,
      categories,
      categoryValue,
      filters,
      searchValue,
    });

    return sortProducts(filteredProducts, sortValue);
  }, [categories, categoryValue, filters, products, searchValue, sortValue]);

  const catalogProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * CATALOG_PAGE_SIZE;
    return sortedCatalogProducts.slice(
      startIndex,
      startIndex + CATALOG_PAGE_SIZE,
    );
  }, [currentPage, sortedCatalogProducts]);

  function searchCatalog(query) {
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
    setSortValue(nextSortValue);
    setCurrentPage(1);
  }

  return {
    catalogProducts,
    catalogTotal: sortedCatalogProducts.length,
    catalogPageSize: CATALOG_PAGE_SIZE,
    currentPage,
    searchValue,
    searchCatalog,
    changeCatalogFilters,
    changeCatalogSort,
    setCurrentPage,
  };
}
