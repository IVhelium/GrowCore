

export default function IconButton({
    children,
    className = "",
    ...props
}) {
    return (
      <button
        className={`relative grid h-11 w-11 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-[#4F8A5B] hover:text-[#4F8A5B] ${className}`}
        {...props}
      >
        {children}
      </button>
    );
}