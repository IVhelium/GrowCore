

export default function FormField({
    lable,
    name,
    type = "text",
    as = "input",
    ...props
}) {
    const Component = as;

    return (
        <lable className="grid gap-2">
            <span className="text-sm font-semibold text-slate-700">{lable}</span>
            <Component 
                name={name}
                type={as === "input" ? type : undefined}
                className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#4F8A5B]"
                {...props}
            />
        </lable>
    );
}