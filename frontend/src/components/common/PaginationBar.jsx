import { Pagination } from "antd";

export default function PaginationBar({
    current = 1,
    total = 0,
    pageSize = 8,
    onChange
}) {
    <div className="mt-8 flex justify-center border-t border-slate-200 pt-6">
        <Pagination
            current={current}
            total={total}
            pageSize={pageSize}
            showSizeChanger={false}
            onChange={onChange}
        />
    </div>
}