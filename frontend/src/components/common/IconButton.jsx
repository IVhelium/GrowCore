

export default function IconButton({
    children,
    className = "",
    ...props
}) {
    <button className={`relative grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-500 hover:text-indigo-600 ${className}`} {...props}>
        {children}
    </button>
}