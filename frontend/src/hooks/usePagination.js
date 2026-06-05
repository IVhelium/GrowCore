import { useMemo, useState } from "react";

export function usePagination(items = [], pageSize = 12) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const pageItems = useMemo(() => {
    const startIndex = (safeCurrentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, pageSize, safeCurrentPage]);

  function changePage(page) {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }

  return {
    currentPage: safeCurrentPage,
    pageItems,
    pageSize,
    total: items.length,
    changePage,
  };
}
