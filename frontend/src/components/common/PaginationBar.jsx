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
      <div className="mt-8 flex justify-center border-t border-slate-200 pt-6">
        <Pagination
            total={total}
            pageSize={pageSize}
            showSizeChanger={false}
            {...paginationProps}
        />
      </div>
    );
}
