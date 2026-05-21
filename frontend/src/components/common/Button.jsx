

export default function Button({
    children,
    style = "primary",
    size = "md",
    className = "",
    ...props
}) {
    const styles = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700",
        secondary: "bg-white text-slate-950 hover:text-indigo-600 border border-slate-200",
        dark: "bg-slate-950 text-white hover:bg-slate-800",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-5 py-2 text-sm",
        lg: "px-7 py-4 text-base"
    };

    return (
        <button className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[style]} ${sizes[size]} ${className}`} {...props}>
            {children}
        </button>
    );
}