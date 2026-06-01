import { useMemo, useState } from "react";

export function usePagination(items = [], pageSize = 12) {
  const [currentPage, setCurrentPage] = useState(1);

  const pageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [currentPage, items, pageSize]);

  function changePage(page) {
    setCurrentPage(page);
  }

  return {
    currentPage,
    pageItems,
    pageSize,
    total: items.length,
    changePage,
  };
}
