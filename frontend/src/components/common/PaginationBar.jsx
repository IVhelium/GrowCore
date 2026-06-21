import { Pagination } from "antd";

export default function PaginationBar({
    current = 1,
    total = 0,
    pageSize = 8,
    onChange,
    hideWhenSinglePage = true,
}) {
    if (hideWhenSinglePage && total <= pageSize) {
        return null;
    }

    const paginationProps = onChange
        ? { current, onChange }
        : { defaultCurrent: current };

    return (
      <div className="mt-8 flex max-w-full justify-start overflow-x-auto border-t border-slate-200 pt-6 sm:justify-center">
        <Pagination
            total={total}
            pageSize={pageSize}
            showSizeChanger={false}
            showLessItems
            responsive
            {...paginationProps}
        />
      </div>
    );
}
