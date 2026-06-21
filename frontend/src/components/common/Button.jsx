

export default function Button({
    children,
    style = "primary",
    size = "md",
    className = "",
    ...props
}) {
    const styles = {
        primary: "bg-[#4F8A5B] text-white hover:bg-[#3F7148]",
        secondary: "bg-white text-slate-950 hover:text-[#4F8A5B] hover:border-[#4F8A5B] border border-slate-200",
        dark: "bg-slate-950 text-white hover:bg-slate-800",
        ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-950",
        danger: "bg-red-50 text-red-600 hover:bg-red-100"
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-5 py-2 text-sm",
        lg: "px-7 py-4 text-base"
    };

    return (
        <button className={`inline-flex min-h-11 max-w-full touch-manipulation items-center justify-center gap-2 whitespace-normal rounded-lg text-center font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${styles[style]} ${sizes[size]} ${className}`} {...props}>
            {children}
        </button>
    );
}
